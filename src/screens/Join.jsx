import { useId, useMemo, useRef, useState } from "react";
import { Screen } from "../components/Screen.jsx";
import { Bar } from "../components/Bar.jsx";
import { Reveal } from "./Reveal.jsx";
import { decodeRound, formatCode } from "../tv/code.js";
import { load, save } from "../lib/storage.js";

// src/assets/windows-lit.webp: every lit window of the TV scenes, 8 per row (made by scripts/window-sprite.mjs)
const WINDOWS = 29;
const SPRITE_COLS = 8;
const SPRITE_ROWS = Math.ceil(WINDOWS / SPRITE_COLS);

// A different random lit window behind each seat.
function randomWindows(count) {
  const pool = Array.from({ length: WINDOWS }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return Array.from({ length: count }, (_, i) => pool[i % WINDOWS]);
}

function windowStyle(n) {
  const x = (n % SPRITE_COLS) / (SPRITE_COLS - 1);
  const y = Math.floor(n / SPRITE_COLS) / (SPRITE_ROWS - 1);
  return { backgroundPosition: `${x * 100}% ${y * 100}%` };
}

const HOLD_MS = 2000;

// One seat window. Picking needs a 2 s hold (pointer, Space or Enter), with a bar that fills, so a touch
// that starts a scroll never picks someone else's card: moving, lifting or a scroll cancels it.
// In tap mode (players who can't hold): first tap selects, a second tap on the same window confirms.
function SeatTile({ index, name, last, style, tapMode, armed, onArm, onPick }) {
  const [holding, setHolding] = useState(false);
  const start = useRef(null);
  const stop = () => setHolding(false);
  const hintId = useId();

  const hold = tapMode
    ? { onClick: () => (armed ? onPick() : onArm()) }
    : {
        onPointerDown: (e) => {
          if (e.button !== 0) return;
          start.current = { x: e.clientX, y: e.clientY };
          setHolding(true);
        },
        onPointerMove: (e) => {
          const s = start.current;
          if (holding && s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10) stop();
        },
        onPointerUp: stop,
        onPointerCancel: stop, // the browser took the touch for a scroll
        onPointerLeave: stop,
        onKeyDown: (e) => {
          if (e.key !== " " && e.key !== "Enter") return;
          e.preventDefault();
          if (!e.repeat) setHolding(true);
        },
        onKeyUp: (e) => {
          if (e.key !== " " && e.key !== "Enter") return;
          e.preventDefault();
          stop();
        },
        onBlur: stop,
        onContextMenu: (e) => e.preventDefault(), // no long-press menu
      };

  const status = holding ? "Κράτα…" : armed ? "Πάτα ξανά για επιβεβαίωση" : last ? "την προηγούμενη φορά" : null;
  return (
    <button
      type="button"
      className={`seat${last ? " last" : ""}${holding ? " holding" : ""}${armed ? " armed" : ""}`}
      style={{ ...style, "--hold": `${HOLD_MS}ms` }}
      aria-describedby={hintId}
      {...hold}
    >
      <span className="num" aria-hidden="true">{index + 1}</span>
      <span className="plate">
        <span className="name">{name}</span>
        {status && <span className="was">{status}</span>}
        <span id={hintId} className="visually-hidden">
          {tapMode ? (armed ? "Πάτα ξανά για επιβεβαίωση" : "Πάτα για επιλογή") : "Κράτα πατημένο για επιλογή"}
        </span>
        {!tapMode && (
          <span className="hold-bar" aria-hidden="true">
            <i onAnimationEnd={(e) => e.animationName === "seat-hold" && onPick()} />
          </span>
        )}
      </span>
    </button>
  );
}

const ERRORS = {
  length: "Ο κωδικός έχει 9 ψηφία.",
  check: "Ο κωδικός δεν είναι σωστός. Έλεγξε τα ψηφία στην TV.",
  version: "Η TV και αυτό το κινητό έχουν διαφορετική λίστα λέξεων. Ανανέωσε τη σελίδα και στα δύο.",
};

// Playing with a TV: the phone gets its card from the round code on the TV (typed, or from the QR link)
// and never talks to anything. "code" → "seat" (who are you?) → "card".
// `link`: { code, names } from a scanned QR, or null.
export function Join({ link, revealMode, onRevealMode, onHome }) {
  const tapId = useId();
  const fromLink = link?.code ? decodeRound(link.code) : null;
  const [code, setCode] = useState(link?.code ? formatCode(link.code) : "");
  const [round, setRound] = useState(fromLink?.ok ? fromLink.round : null);
  const [error, setError] = useState(fromLink && !fromLink.ok ? fromLink.error : "");
  // Names come only with the QR link, and only when they match the round's seats.
  const linkNames = link?.names && fromLink?.ok && link.names.length === fromLink.round.players ? link.names : null;
  const [names, setNames] = useState(linkNames);
  const [seat, setSeat] = useState(null);
  const [armed, setArmed] = useState(null); // tap mode: the window tapped once, waiting for a second tap
  const [phase, setPhase] = useState(fromLink?.ok ? "seat" : "code");
  const inputId = useId();
  const errorId = useId();
  const helpId = useId();
  const input = useRef(null);
  useState(() => linkNames && save("tvNames", linkNames)); // once per link (Join is keyed by it)

  const windows = useMemo(() => (round ? randomWindows(round.players) : []), [round]);
  const seatName = (i) => (names ? names[i] : `Θέση ${i + 1}`);

  function submit(e) {
    e.preventDefault();
    const r = decodeRound(code);
    if (!r.ok) {
      setError(r.error);
      input.current?.focus();
      return;
    }
    setError("");
    setRound(r.round);
    // A typed code carries no names: reuse the ones from this phone's last QR round if the seat count matches.
    // The seat number stays on each tile, so it can be checked against the TV's plates.
    const last = load("tvNames", null);
    setNames(Array.isArray(last) && last.length === r.round.players ? last : null);
    setPhase("seat");
  }

  function pick(i) {
    setSeat(i);
    setArmed(null);
    save("tvSeat", { name: names ? names[i] : null, index: i });
    setPhase("card");
  }

  function newCode() {
    setCode("");
    setRound(null);
    setSeat(null);
    setPhase("code");
  }

  if (phase === "card") {
    return (
      <Reveal
        key={`tv-${code}-${seat}`}
        round={round}
        isImposter={round.imposters.includes(seat)}
        hintMode={round.hintMode}
        revealMode={revealMode}
        header={
          <div className="bar">
            <span>Γύρος TV</span>
            <span>{seatName(seat)}</span>
          </div>
        }
        actions={
          <div className="stack">
            <button type="button" className="btn ghost" onClick={newCode}>Νέος γύρος · νέος κωδικός</button>
            <button type="button" className="link center-link" onClick={() => setPhase("seat")}>
              Δεν είμαι η/ο {seatName(seat)}
            </button>
          </div>
        }
      />
    );
  }

  if (phase === "seat") {
    const last = load("tvSeat", null);
    const lastIndex = names ? names.indexOf(last?.name) : last?.index;
    return (
      <Screen title="Ποιος είσαι;" before={<Bar onBack={newCode} step="TV" />}>
        <p className="sub">
          {names ? "Βρες το όνομά σου" : "Βρες τη θέση σου, όπως τη δείχνει η TV"}
          {revealMode === "tap" ? " και πάτα το δύο φορές." : " και κράτα το πατημένο μέχρι να γεμίσει η μπάρα."}
          {names && " Ο αριθμός είναι ίδιος με της TV."} Μετά, μην δείξεις την οθόνη σε κανέναν.
        </p>
        <ul className="seats">
          {Array.from({ length: round.players }, (_, i) => (
            <li key={i}>
              <SeatTile
                index={i}
                name={seatName(i)}
                last={i === lastIndex}
                style={windowStyle(windows[i])}
                tapMode={revealMode === "tap"}
                armed={armed === i}
                onArm={() => setArmed(i)}
                onPick={() => pick(i)}
              />
            </li>
          ))}
        </ul>
        <div className="grow" />
        {/* For players who can't press and hold: the same choice as «Εμφάνιση κάρτας» in the settings */}
        <div className="timerset">
          <div className="row">
            <span id={tapId}>Πάτα για εμφάνιση / απόκρυψη</span>
            <button
              type="button"
              role="switch"
              aria-checked={revealMode === "tap"}
              aria-labelledby={tapId}
              className="switch"
              onClick={() => onRevealMode(revealMode === "tap" ? "hold" : "tap")}
            >
              <span className="state">{revealMode === "tap" ? "Ναι" : "Όχι"}</span>
              <span className="track" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Μπες σε γύρο TV" before={<Bar onBack={onHome} />}>
      <p className="sub" id={helpId}>
        Σκάναρε το QR της TV με την κάμερα του κινητού, ή γράψε εδώ τον κωδικό που δείχνει.
      </p>
      <form className="join" onSubmit={submit} noValidate>
        <label htmlFor={inputId} className="label">Κωδικός γύρου</label>
        <input
          ref={input}
          id={inputId}
          className="code-in"
          value={code}
          inputMode="numeric"
          autoComplete="one-time-code"
          enterKeyHint="go"
          placeholder="000 000 000"
          maxLength={11}
          aria-describedby={error ? `${errorId} ${helpId}` : helpId}
          aria-invalid={error ? "true" : undefined}
          onChange={(e) => {
            setCode(formatCode(e.target.value.replace(/\D/g, "").slice(0, 9)));
            if (error) setError("");
          }}
        />
        <p id={errorId} className="error" role="alert">{error ? ERRORS[error] : ""}</p>
        {error === "version" && (
          <button type="button" className="btn ghost" onClick={() => location.reload()}>Ανανέωση</button>
        )}
        <div className="grow" />
        <button type="submit" className="btn">Συνέχεια</button>
      </form>
    </Screen>
  );
}

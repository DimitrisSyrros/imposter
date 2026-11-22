import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Screen } from "../components/Screen.jsx";
import { Bar } from "../components/Bar.jsx";
import { Reveal } from "./Reveal.jsx";
import { Stepper } from "../components/Stepper.jsx";
import { decodeGame, formatCode, gameRound } from "../tv/code.js";
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
  length: "Ο κωδικός έχει 11 ψηφία.",
  check: "Ο κωδικός δεν είναι σωστός. Έλεγξε τα ψηφία στην TV.",
  version: "Η TV και αυτό το κινητό έχουν διαφορετική λίστα λέξεων. Ανανέωσε τη σελίδα και στα δύο.",
};

const MAX_ROUND = 99;
const NEXT_DELAY_MS = 1200; // «Επόμενος γύρος» stays locked this long, so a double tap can't skip a round
const RESUME_MS = 6 * 60 * 60 * 1000; // reopening the app within 6 hours goes back to the same game

// The game this phone is in, kept so a reload or a locked phone doesn't lose the seat and round.
function loadSaved() {
  const s = load("tvGame", null);
  if (!s || typeof s !== "object" || Date.now() - s.at > RESUME_MS) return null;
  const d = decodeGame(s.code);
  if (!d.ok || !Number.isInteger(s.seat) || s.seat < 0 || s.seat >= d.game.players) return null;
  const names = Array.isArray(s.names) && s.names.length === d.game.players ? s.names : null;
  return { game: d.game, seat: s.seat, round: Math.min(MAX_ROUND, Math.max(1, Math.floor(s.round) || 1)), names };
}

// Playing with a TV: the phone works out every card from the game code on the TV (typed once, or from
// the QR link) and never talks to anything. "code" → "seat" (who are you? which round?) → "card",
// then «Επόμενος γύρος» for each new round, with no new code.
// `link`: { code, round, names } from a scanned QR, or null.
export function Join({ link, revealMode, onRevealMode, onHome }) {
  const tapId = useId();
  const fromLinkRaw = link?.code ? decodeGame(link.code) : null;
  // Reopening the app (or the browser reloading the QR link after the screen was off) goes back to the
  // saved card, unless the link is for another game.
  const [saved] = useState(() => {
    const s = loadSaved();
    if (!s || (link && link.code !== s.game.code)) return null;
    return { ...s, round: Math.max(s.round, link?.round ?? 1) };
  });
  const fromLink = saved ? null : fromLinkRaw;
  const [code, setCode] = useState(saved ? formatCode(saved.game.code) : link?.code ? formatCode(link.code) : "");
  const [game, setGame] = useState(fromLink?.ok ? fromLink.game : saved?.game ?? null);
  const [roundNo, setRoundNo] = useState(fromLink?.ok ? Math.min(MAX_ROUND, link.round) : saved?.round ?? 1);
  const [error, setError] = useState(fromLink && !fromLink.ok ? fromLink.error : "");
  // Names come only with the QR link, and only when they match the game's seats.
  const linkNames = link?.names && fromLink?.ok && link.names.length === fromLink.game.players ? link.names : null;
  const [names, setNames] = useState(saved?.names ?? linkNames);
  const [seat, setSeat] = useState(saved?.seat ?? null);
  const [armed, setArmed] = useState(null); // tap mode: the window tapped once, waiting for a second tap
  const [phase, setPhase] = useState(fromLink?.ok ? "seat" : saved ? "card" : "code");
  const [loading, setLoading] = useState(false);
  const [pickRound, setPickRound] = useState(1); // the round chooser's value before it is confirmed
  const inputId = useId();
  const errorId = useId();
  const helpId = useId();
  const input = useRef(null);
  useState(() => linkNames && save("tvNames", linkNames)); // once per link (Join is keyed by it)

  const round = useMemo(() => (game ? gameRound(game, roundNo) : null), [game, roundNo]);
  const windows = useMemo(() => (game ? randomWindows(game.players) : []), [game]);
  const seatName = (i) => (names ? names[i] : `Θέση ${i + 1}`);

  // Keep the place in the game while a card is on screen.
  useEffect(() => {
    if (phase === "card" && game) save("tvGame", { code: game.code, seat, round: roundNo, names, at: Date.now() });
  }, [phase, game, seat, roundNo, names]);

  // «Επόμενος γύρος»: locked with a spinner for a moment, then the next card.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      setRoundNo((r) => Math.min(MAX_ROUND, r + 1));
      setLoading(false);
    }, NEXT_DELAY_MS);
    return () => clearTimeout(t);
  }, [loading]);

  function submit(e) {
    e.preventDefault();
    const r = decodeGame(code);
    if (!r.ok) {
      setError(r.error);
      input.current?.focus();
      return;
    }
    setError("");
    if (game?.code !== r.game.code) setRoundNo(1);
    setGame(r.game);
    // A typed code carries no names: reuse the ones from this phone's last QR game if the seat count matches.
    // The seat number stays on each tile, so it can be checked against the TV's plates.
    const last = load("tvNames", null);
    setNames(Array.isArray(last) && last.length === r.game.players ? last : null);
    setPhase("seat");
  }

  function pick(i) {
    setSeat(i);
    setArmed(null);
    save("tvSeat", { name: names ? names[i] : null, index: i });
    setPhase("card");
  }

  function newCode() {
    try { localStorage.removeItem("tvGame"); } catch {}
    setCode("");
    setGame(null);
    setSeat(null);
    setRoundNo(1);
    setPhase("code");
  }

  if (phase === "card") {
    return (
      <Reveal
        key={`tv-${game.code}-${seat}-${roundNo}`}
        round={round}
        isImposter={round.imposters.includes(seat)}
        hintMode={round.hintMode}
        revealMode={revealMode}
        header={
          <div className="bar">
            <span className="round-pill">Γύρος <b>{roundNo}</b></span>
            <span>{seatName(seat)}</span>
          </div>
        }
        actions={
          <div className="stack">
            <button
              type="button"
              className={`btn ghost${loading ? " is-loading" : ""}`}
              aria-disabled={loading || roundNo >= MAX_ROUND ? "true" : undefined}
              onClick={() => !loading && roundNo < MAX_ROUND && setLoading(true)}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span role="status">Γύρος {roundNo + 1}…</span>
                </>
              ) : (
                "Επόμενος γύρος"
              )}
            </button>
            {/* well apart from «Επόμενος γύρος», so one can't be pressed for the other */}
            <button type="button" className="btn ghost lost" onClick={() => { setPickRound(roundNo); setPhase("round"); }}>
              Μπερδεύτηκα · Διάλεξε γύρο
            </button>
          </div>
        }
      />
    );
  }

  // Back into the game after falling out of step: pick the round the TV shows, then the card.
  if (phase === "round") {
    return (
      <Screen title="Σε ποιον γύρο είστε;" before={<Bar onBack={() => setPhase("card")} step="TV" />}>
        <p className="sub">Δες τον γύρο πάνω δεξιά στην TV και διάλεξε τον ίδιο εδώ.</p>
        <Stepper
          label="Γύρος"
          value={pickRound}
          min={1}
          max={MAX_ROUND}
          onChange={setPickRound}
          decLabel="Προηγούμενος γύρος"
          incLabel="Επόμενος γύρος"
        />
        <div className="grow" />
        <div className="stack">
          <button type="button" className="btn" onClick={() => { setRoundNo(pickRound); setPhase("card"); }}>
            Πίσω στο παιχνίδι · Γύρος {pickRound}
          </button>
          <button type="button" className="link center-link" onClick={() => setPhase("seat")}>
            Λάθος θέση; Άλλαξέ τη
          </button>
        </div>
      </Screen>
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
        <Stepper
          label="Γύρος, όπως στην TV"
          value={roundNo}
          min={1}
          max={MAX_ROUND}
          onChange={setRoundNo}
          decLabel="Προηγούμενος γύρος"
          incLabel="Επόμενος γύρος"
        />
        <ul className="seats">
          {Array.from({ length: game.players }, (_, i) => (
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
        Σκάναρε το QR της TV με την κάμερα του κινητού, ή γράψε εδώ τον κωδικό που δείχνει. Τον γράφεις μία φορά για όλο το παιχνίδι.
      </p>
      <form className="join" onSubmit={submit} noValidate>
        <label htmlFor={inputId} className="label">Κωδικός παιχνιδιού</label>
        <input
          ref={input}
          id={inputId}
          className="code-in"
          value={code}
          inputMode="numeric"
          autoComplete="one-time-code"
          enterKeyHint="go"
          placeholder="000 0000 0000"
          maxLength={13}
          aria-describedby={error ? `${errorId} ${helpId}` : helpId}
          aria-invalid={error ? "true" : undefined}
          onChange={(e) => {
            setCode(formatCode(e.target.value.replace(/\D/g, "").slice(0, 11)));
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

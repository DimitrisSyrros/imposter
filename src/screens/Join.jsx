import { useId, useRef, useState } from "react";
import { Screen } from "../components/Screen.jsx";
import { Bar } from "../components/Bar.jsx";
import { Avatar } from "../components/Avatar.jsx";
import { Reveal } from "./Reveal.jsx";
import { decodeRound, formatCode } from "../tv/code.js";
import { load, save } from "../lib/storage.js";

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
  const [names, setNames] = useState(link?.names && fromLink?.ok && link.names.length === fromLink.round.players ? link.names : null);
  const [seat, setSeat] = useState(null);
  const [phase, setPhase] = useState(fromLink?.ok ? "seat" : "code");
  const inputId = useId();
  const errorId = useId();
  const helpId = useId();
  const input = useRef(null);

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
    setNames(null); // a typed code has no names; seats are numbered as on the TV
    setPhase("seat");
  }

  function pick(i) {
    setSeat(i);
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
          {names ? "Πάτα το όνομά σου." : "Πάτα τη θέση σου, όπως τη δείχνει η TV."} Μετά, μην δείξεις την οθόνη σε κανέναν.
        </p>
        <ul className="seats">
          {Array.from({ length: round.players }, (_, i) => (
            <li key={i}>
              <button type="button" className={`seat${i === lastIndex ? " last" : ""}`} onClick={() => pick(i)}>
                <Avatar name={names ? names[i] : String(i + 1)} index={i} />
                <span className="name">{seatName(i)}</span>
                {i === lastIndex && <span className="was">την προηγούμενη φορά</span>}
              </button>
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

import { useEffect, useId, useState } from "react";
import { Screen } from "../components/Screen.jsx";
import { Dots } from "../components/Dots.jsx";
import { Logo } from "../components/Logo.jsx";
import { fitStyle } from "../lib/format.js";

// Screens 5 and 6. One component for both roles so the background, card, angle, size and
// buttons can never drift apart: only the text inside the card differs.
// The card's contents are rendered only while it is shown, and never announced (no aria-live).
export function Reveal({ round, index, total, isImposter, hintMode, revealMode, onNext }) {
  const [shown, setShown] = useState(false);
  const [seen, setSeen] = useState(false);
  const needId = useId();
  const hold = revealMode !== "tap";

  const show = () => { setShown(true); setSeen(true); };
  const hide = () => setShown(false);

  // Hide the card if the phone is locked or the app is switched away.
  useEffect(() => {
    const onHidden = () => document.visibilityState === "hidden" && setShown(false);
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);

  // A long press anywhere on this screen must not open the phone's menu (save image, copy, ...).
  useEffect(() => {
    const block = (e) => e.preventDefault();
    document.addEventListener("contextmenu", block);
    return () => document.removeEventListener("contextmenu", block);
  }, []);

  const holdHandlers = {
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      show();
    },
    onPointerUp: hide,
    onPointerCancel: hide,
    onLostPointerCapture: hide,
    onKeyDown: (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) show();
      }
    },
    onKeyUp: (e) => {
      if (e.key === " " || e.key === "Enter") hide();
    },
    onBlur: hide,
  };

  const tapHandlers = {
    "aria-pressed": shown,
    onClick: () => (shown ? hide() : show()),
  };

  return (
    <Screen title="Η κάρτα σου" titleClassName="visually-hidden" before={<Dots total={total} current={index} />}>
      <div className="grow" />
      <div className={`card${shown ? " open" : ""}`} tabIndex={0} role="group" aria-label="Η κάρτα σου">
        {/* The whole card is the reveal control: a real button laid over it, so the text below
            keeps its structure and is read only when the player moves to it. */}
        <button type="button" className="card-hit" {...(hold ? holdHandlers : tapHandlers)}>
          <span className="visually-hidden">{hold ? "Κράτα πατημένη την κάρτα για να τη δεις" : "Δείξε την κάρτα"}</span>
        </button>
        {!shown ? (
          <div className="card-back">
            <Logo />
            <span className="note">Κρυφή κάρτα</span>
          </div>
        ) : isImposter ? (
          <>
            <span className="label">Δεν ξέρεις τη λέξη</span>
            <span className="word imp">Είσαι ο Imposter</span>
            <dl className="clue">
              {hintMode !== "hintOnly" && (
                <>
                  <dt>Κατηγορία</dt>
                  <dd>{round.category}</dd>
                </>
              )}
              {hintMode !== "category" && (
                <>
                  <dt>Στοιχείο</dt>
                  <dd>{round.hint}</dd>
                </>
              )}
            </dl>
            <span className="note">Μπλόφαρε. Αν σε πιάσουν, έχεις μία ευκαιρία να μαντέψεις.</span>
          </>
        ) : (
          <>
            <span className="label">Η λέξη σου</span>
            <span className="word" style={fitStyle(round.word)}>{round.word}</span>
            <span className="note">Δώσε ένα στοιχείο που να δείχνει ότι την ξέρεις, χωρίς να τη φανερώνει.</span>
          </>
        )}
      </div>
      <div className="grow" />

      <p className="hold">
        {hold
          ? shown ? "Άφησε την κάρτα για να κρυφτεί" : "Κράτα πατημένη την κάρτα για να δεις"
          : shown ? "Πάτα ξανά την κάρτα για να κρυφτεί" : "Πάτα την κάρτα για να δεις"}
      </p>
      <div className="stack">
        <button
          type="button"
          className="btn dark"
          aria-disabled={!seen || undefined}
          aria-describedby={!seen ? needId : undefined}
          onClick={() => { if (seen) { hide(); onNext(); } }}
        >
          Το είδα · Επόμενος
        </button>
        {!seen && <span id={needId} className="visually-hidden">Δες πρώτα την κάρτα σου.</span>}
      </div>
    </Screen>
  );
}

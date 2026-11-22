import { useEffect, useRef, useState } from "react";
import { Screen } from "../components/Screen.jsx";
import { turnOrder } from "../game/state.js";
import { TvEnd } from "./TvEnd.jsx";
import { CornerCode } from "./TvScreens.jsx";

// The group votes out loud; the TV reveals. Same rules and words as Unmask.jsx on the phone:
// "hidden" → "caught" (did you catch them?) → "guess" (they say a word out loud) → "judge" (word shown) → "done".
// A caught imposter wins only by finding the word; one who got away wins either way.
export function TvUnmask({ players, round, code, hintMode, onNewRound, onPlayers }) {
  const [phase, setPhase] = useState("hidden");
  const [caught, setCaught] = useState(false);
  const [guessed, setGuessed] = useState(false);
  const status = useRef(null);

  const many = round.imposters.length > 1;
  const names = round.imposters.map((i) => players[i]).join(", ");
  const order = turnOrder(players.length, round.start).map((i) => players[i]);

  useEffect(() => {
    if (phase !== "hidden") status.current?.focus();
  }, [phase]);

  const wins = many ? "Οι Imposters κερδίζουν." : "Ο Imposter κερδίζει.";
  let stamp = null;
  let line;
  if (phase === "hidden") {
    line = `Δείξτε όλοι μαζί στο τρία: ποιος είναι ο Imposter; Η σειρά ήταν: ${order.join(", ")}.`;
  } else if (phase === "caught") {
    line = many ? "Πιάσατε κάποιον από αυτούς;" : "Τον πιάσατε;";
  } else if (!caught) {
    stamp = { text: many ? "Γλίτωσαν" : "Γλίτωσε", kind: "lose" };
    if (phase === "guess") line = `${wins} Πριν δείτε τη λέξη, ${many ? "πείτε" : "πες"} δυνατά ποια νομίζ${many ? "ετε" : "εις"} ότι είναι.`;
    else if (phase === "judge") line = "Ήταν σωστή η λέξη που είπε;";
    else if (guessed) {
      stamp.text = many ? "Γλίτωσαν και τη βρήκαν" : "Γλίτωσε και τη βρήκε";
      line = `${many ? "Γλίτωσαν και βρήκαν" : "Γλίτωσε και βρήκε"} και τη λέξη. ${wins}`;
    } else line = `Η λέξη δεν βρέθηκε, αλλά ${many ? "γλίτωσαν" : "γλίτωσε"}. ${wins}`;
  } else if (phase === "guess" || phase === "judge") {
    stamp = { text: many ? "Πιάσατε έναν" : "Τον πιάσατε", kind: "win" };
    line = phase === "guess"
      ? "Τελευταία ευκαιρία: πες δυνατά ποια νομίζεις ότι είναι η λέξη. Αν τη βρεις, κερδίζεις."
      : "Ήταν σωστή η λέξη που είπε;";
  } else {
    stamp = guessed ? { text: "Βρήκε τη λέξη", kind: "lose" } : { text: "Η παρέα κερδίζει", kind: "win" };
    line = guessed ? "Η λέξη βρέθηκε! Ο Imposter κλέβει τη νίκη." : "Η λέξη δεν βρέθηκε. Η παρέα κερδίζει.";
  }

  const revealed = phase !== "hidden";
  const wordShown = phase === "judge" || phase === "done";
  const done = phase === "done";
  const clue = hintMode !== "category" ? `στοιχείο: ${round.hint}` : `κατηγορία: ${round.category}`;

  return (
    <Screen
      className={`tvs tv-unmask${done ? " is-done" : ""}${revealed ? "" : " tv-pointing has-corner"}`}
      titleClassName="verdict"
      title={
        <>
          {stamp && <span className={`stamp ${stamp.kind}${done ? " pop" : ""}`}>{stamp.text}</span>}
          <span className="h">{!revealed ? "Ψηφίστε φωναχτά" : many ? `Οι Imposters: ${names}` : `Ο Imposter: ${names}`}</span>
        </>
      }
      before={done ? <TvEnd kind={stamp.kind} /> : <div className="tv-redline" />}
    >
      <p className="sub tv-line" ref={status} tabIndex={-1}>{line}</p>
      {revealed && (
        <p className="tv-word">
          {wordShown ? (
            <>Η λέξη: <b>{round.word}</b> · {clue}</>
          ) : (
            <>Η λέξη: <b><span aria-hidden="true">• • •</span><span className="visually-hidden">κρυφή μέχρι την πρόβλεψη</span></b> · {clue}</>
          )}
        </p>
      )}
      <div className="grow" />
      <div className={done ? "tv-flank" : "tv-row center"}>
        {phase === "hidden" && (
          <button type="button" className="btn" onClick={() => setPhase("caught")}>
            {many ? "Αποκάλυψε τους Imposters" : "Αποκάλυψε τον Imposter"}
          </button>
        )}
        {phase === "caught" && (
          <>
            <button type="button" className="btn" onClick={() => { setCaught(true); setPhase("guess"); }}>{many ? "Ναι, πιάσαμε" : "Ναι, τον πιάσαμε"}</button>
            <button type="button" className="btn ghost" onClick={() => { setCaught(false); setPhase("guess"); }}>{many ? "Όχι, γλίτωσαν" : "Όχι, γλίτωσε"}</button>
          </>
        )}
        {phase === "guess" && <button type="button" className="btn" onClick={() => setPhase("judge")}>Το είπε · Δείξε τη λέξη</button>}
        {phase === "judge" && (
          <>
            <button type="button" className="btn" onClick={() => { setGuessed(true); setPhase("done"); }}>Το βρήκε</button>
            <button type="button" className="btn ghost" onClick={() => { setGuessed(false); setPhase("done"); }}>Δεν το βρήκε</button>
          </>
        )}
        {done && (
          <>
            <button type="button" className="btn" onClick={onNewRound}>Νέος γύρος</button>
            <button type="button" className="btn ghost" onClick={onPlayers}>Αλλαγή παικτών</button>
          </>
        )}
      </div>
      {!revealed && <CornerCode code={code} round={round.number} />}
    </Screen>
  );
}

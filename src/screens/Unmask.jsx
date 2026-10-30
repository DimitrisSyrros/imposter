import { useEffect, useRef, useState } from "react";
import { Screen } from "../components/Screen.jsx";
import { RoundFacts } from "../components/RoundFacts.jsx";

// With «Κρυφή ψηφοφορία» off the group gives clues and votes out loud; the phone only reveals.
// "hidden" → names not shown yet, "caught" → did the group catch them?,
// "guess" → caught imposter says a word out loud, "judge" → word shown, did they get it?, "done".
export function Unmask({ players, round, hintMode, onNewRound, onPlayers }) {
  const [phase, setPhase] = useState("hidden");
  const [caught, setCaught] = useState(false);
  const [guessed, setGuessed] = useState(false);
  const status = useRef(null);

  const many = round.imposters.length > 1;
  const names = round.imposters.map((i) => players[i]).join(", ");
  const go = (next) => setPhase(next);

  // Every step after the first changes the screen in place: move focus to the new status line.
  useEffect(() => {
    if (phase !== "hidden") status.current?.focus();
  }, [phase]);

  let stamp = null;
  let line;
  if (phase === "hidden") {
    line = `Δώστε στοιχεία με τη σειρά και ψηφίστε φωναχτά ποιος είναι ο Imposter. Όταν αποφασίσετε, πατήστε το κουμπί.`;
  } else if (phase === "caught") {
    line = many ? "Πιάσατε κάποιον από αυτούς;" : "Τον πιάσατε;";
  } else if (phase === "guess") {
    stamp = { text: many ? "Πιάσατε έναν" : "Τον πιάσατε", kind: "win" };
    line = "Τελευταία ευκαιρία: πες δυνατά ποια νομίζεις ότι είναι η λέξη. Αν τη βρεις, κερδίζεις.";
  } else if (phase === "judge") {
    stamp = { text: many ? "Πιάσατε έναν" : "Τον πιάσατε", kind: "win" };
    line = "Ήταν σωστή η λέξη που είπε;";
  } else if (!caught) {
    stamp = { text: many ? "Γλίτωσαν" : "Γλίτωσε", kind: "lose" };
    line = many ? "Οι Imposters κερδίζουν." : "Ο Imposter κερδίζει.";
  } else {
    stamp = guessed ? { text: "Βρήκε τη λέξη", kind: "lose" } : { text: "Η παρέα κερδίζει", kind: "win" };
    line = guessed ? "Η λέξη βρέθηκε! Ο Imposter κλέβει τη νίκη." : "Η λέξη δεν βρέθηκε. Η παρέα κερδίζει.";
  }

  const revealed = phase !== "hidden";
  return (
    <Screen
      titleClassName="verdict"
      title={
        <>
          {stamp && <span className={`stamp ${stamp.kind}`}>{stamp.text}</span>}
          <span className="h">
            {!revealed ? "Ψηφίστε φωναχτά" : many ? `Οι Imposters: ${names}` : `Ο Imposter: ${names}`}
          </span>
        </>
      }
    >
      <p className="sub center" ref={status} tabIndex={-1}>{line}</p>

      {revealed && <RoundFacts round={round} hintMode={hintMode} wordShown={phase === "judge" || phase === "done"} />}

      <div className="grow" />
      <div className="stack">
        {phase === "hidden" && (
          <button type="button" className="btn" onClick={() => go("caught")}>
            {many ? "Αποκάλυψε τους Imposters" : "Αποκάλυψε τον Imposter"}
          </button>
        )}
        {phase === "caught" && (
          <div className="pair">
            <button type="button" className="btn" onClick={() => { setCaught(true); go("guess"); }}>
              {many ? "Ναι, πιάσαμε" : "Ναι, τον πιάσαμε"}
            </button>
            <button type="button" className="btn ghost" onClick={() => { setCaught(false); go("done"); }}>
              {many ? "Όχι, γλίτωσαν" : "Όχι, γλίτωσε"}
            </button>
          </div>
        )}
        {phase === "guess" && (
          <button type="button" className="btn" onClick={() => go("judge")}>
            Το είπε · Δείξε τη λέξη
          </button>
        )}
        {phase === "judge" && (
          <div className="pair">
            <button type="button" className="btn" onClick={() => { setGuessed(true); go("done"); }}>
              Το βρήκε
            </button>
            <button type="button" className="btn ghost" onClick={() => { setGuessed(false); go("done"); }}>
              Δεν το βρήκε
            </button>
          </div>
        )}
        {phase === "done" && (
          <>
            <button type="button" className="btn" onClick={onNewRound}>Νέος γύρος</button>
            <button type="button" className="btn ghost" onClick={onPlayers}>Αλλαγή παικτών</button>
          </>
        )}
      </div>
    </Screen>
  );
}

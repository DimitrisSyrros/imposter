import { useEffect, useRef, useState } from "react";
import { Screen } from "../components/Screen.jsx";
import { RoundFacts } from "../components/RoundFacts.jsx";
import { verdict } from "../game/state.js";

// Screen 9. If the imposter is caught, the word stays hidden until they have said their guess
// out loud; then the group reveals it and says whether the guess was right.
export function Result({ players, round, hintMode, onNewRound, onPlayers }) {
  const { counts, top, caught } = verdict(players.length, round);
  // "guess" → waiting for the caught imposter's guess, "judge" → word shown, did they get it?
  // "done" → final. When nobody is caught there is nothing to guess.
  const [phase, setPhase] = useState(caught === null ? "done" : "guess");
  const [guessed, setGuessed] = useState(false);
  const outcome = useRef(null);

  const many = round.imposters.length > 1;
  const impNames = round.imposters.map((i) => players[i]).join(", ");
  const wordShown = phase !== "guess";

  let stamp, stampKind;
  if (caught === null) [stamp, stampKind] = [many ? "Γλίτωσαν" : "Γλίτωσε", "lose"];
  else if (phase === "done") [stamp, stampKind] = guessed ? ["Βρήκε τη λέξη", "lose"] : ["Η παρέα κερδίζει", "win"];
  else [stamp, stampKind] = [many ? "Πιάσατε έναν" : "Τον πιάσατε", "win"];

  let line;
  if (caught === null) {
    line = top.length > 1
      ? `Ισοψηφία ανάμεσα σε: ${top.map((i) => players[i]).join(", ")}. ${many ? "Οι Imposters κερδίζουν." : "Ο Imposter κερδίζει."}`
      : `Οι περισσότερες ψήφοι πήγαν σε: ${players[top[0]]}. ${many ? "Οι Imposters κερδίζουν." : "Ο Imposter κερδίζει."}`;
  } else if (phase === "guess") {
    line = `Τελευταία ευκαιρία: ${players[caught]}, πες δυνατά ποια νομίζεις ότι είναι η λέξη. Αν τη βρεις, κερδίζεις.`;
  } else if (phase === "judge") {
    line = "Ήταν σωστή η λέξη που είπε;";
  } else {
    line = guessed
      ? "Η λέξη βρέθηκε! Ο Imposter κλέβει τη νίκη."
      : "Η λέξη δεν βρέθηκε. Η παρέα κερδίζει.";
  }

  // After the group judges the guess, move focus to the new outcome so it is read out.
  useEffect(() => {
    if (caught !== null && phase === "done") outcome.current?.focus();
  }, [phase, caught]);

  const max = Math.max(1, ...counts);
  const rows = counts
    .map((c, i) => ({ i, c }))
    .filter((r) => r.c > 0)
    .sort((a, b) => b.c - a.c || a.i - b.i);

  return (
    <Screen
      titleClassName="verdict"
      title={
        <>
          <span className={`stamp ${stampKind}`}>{stamp}</span>
          <span className="h">{many ? `Οι Imposters: ${impNames}` : `Ο Imposter: ${impNames}`}</span>
        </>
      }
    >
      <p className="sub center" ref={outcome} tabIndex={-1}>{line}</p>

      <RoundFacts round={round} hintMode={hintMode} wordShown={wordShown} />

      <section className="stack" aria-labelledby="tally-title">
        <h2 id="tally-title" className="label">Ψήφοι</h2>
        <ul className="tally">
          {rows.map(({ i, c }) => {
            const imp = round.imposters.includes(i);
            return (
              <li key={i} className={top.includes(i) ? "hit" : undefined}>
                <span className="who">
                  {players[i]}
                  {imp && <span className="tag">Imposter</span>}
                </span>
                <i aria-hidden="true" style={{ width: `${(c / max) * 100}%` }} />
                <span className="n">
                  {c}
                  <span className="visually-hidden"> {c === 1 ? "ψήφος" : "ψήφοι"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grow" />
      <div className="stack">
        {phase === "guess" && (
          <button type="button" className="btn" onClick={() => setPhase("judge")}>
            Το είπε · Δείξε τη λέξη
          </button>
        )}
        {phase === "judge" && (
          <div className="pair">
            <button type="button" className="btn" onClick={() => { setGuessed(true); setPhase("done"); }}>
              Το βρήκε
            </button>
            <button type="button" className="btn ghost" onClick={() => { setGuessed(false); setPhase("done"); }}>
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

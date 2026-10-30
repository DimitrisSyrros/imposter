import { useId, useState } from "react";
import { Screen } from "../components/Screen.jsx";
import { Avatar } from "../components/Avatar.jsx";

// One secret ballot. Players are radio buttons drawn as cards; the voter can't pick themselves.
// The pick is only kept here until it is locked, so the next voter never sees it.
export function Vote({ players, voter, voted, onVote }) {
  const [pick, setPick] = useState(null);
  const needId = useId();

  return (
    <Screen
      title={`${players[voter]}, ποιος είναι ο Imposter;`}
      before={
        <div className="bar">
          <span>Ψηφοφορία</span>
          <span className="step">{voted} / {players.length} ψήφισαν</span>
        </div>
      }
    >
      <fieldset>
        <legend className="visually-hidden">Ψήφισε έναν παίκτη</legend>
        <div className="vote">
          {players.map((p, i) =>
            i === voter ? null : (
              <label key={p} className={pick === i ? "picked" : undefined}>
                <input type="radio" name="vote" value={i} checked={pick === i} onChange={() => setPick(i)} />
                <Avatar name={p} index={i} />
                <span className="name">{p}</span>
                {pick === i && <span className="yours">Η ψήφος σου</span>}
              </label>
            ),
          )}
        </div>
      </fieldset>

      <div className="grow" />
      {pick === null && <p id={needId} className="privacy">Διάλεξε έναν παίκτη. Η ψήφος σου μένει μυστική.</p>}
      <button
        type="button"
        className="btn"
        aria-disabled={pick === null || undefined}
        aria-describedby={pick === null ? needId : undefined}
        onClick={() => pick !== null && onVote(pick)}
      >
        Κλείδωσε την ψήφο
      </button>
    </Screen>
  );
}

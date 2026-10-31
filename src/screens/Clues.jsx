import { useEffect, useId, useRef, useState } from "react";
import { Screen } from "../components/Screen.jsx";
import { turnOrder } from "../game/state.js";
import { useCountdown } from "../lib/useCountdown.js";
import { formatTime, spokenTime } from "../lib/format.js";

const RING_R = 58;
const RING_LEN = 2 * Math.PI * RING_R;

function Timer({ total, onDone }) {
  const { left, running, done, toggle } = useCountdown(total, true);
  const [message, setMessage] = useState("");
  const prev = useRef(left);

  // Announce only at key moments, never every second.
  useEffect(() => {
    const was = prev.current;
    prev.current = left;
    if (was > 60 && left <= 60 && left > 10) setMessage("Απομένει 1 λεπτό.");
    else if (was > 10 && left <= 10 && left > 0) setMessage("Απομένουν 10 δευτερόλεπτα.");
    else if (was > 0 && left === 0) {
      setMessage("Τέλος χρόνου!");
      try { navigator.vibrate?.([200, 100, 200]); } catch {}
      onDone();
    }
  }, [left, onDone]);

  return (
    <div className="timer-block">
      <div className={`timer${done ? " over" : ""}`} role="timer" aria-label="Χρόνος που απομένει">
        <svg viewBox="0 0 132 132" aria-hidden="true">
          <circle cx="66" cy="66" r={RING_R} className="ring-track" />
          <circle
            cx="66" cy="66" r={RING_R} className="ring-fill"
            strokeDasharray={RING_LEN}
            strokeDashoffset={RING_LEN * (1 - left / total)}
          />
        </svg>
        <div>
          <b aria-hidden="true">{formatTime(left)}</b>
          <small aria-hidden="true">{done ? "τέλος χρόνου" : running ? "απομένουν" : "σε παύση"}</small>
          <span className="visually-hidden">{done ? "Τέλος χρόνου" : `${spokenTime(left)}${running ? "" : ", σε παύση"}`}</span>
        </div>
      </div>
      {!done && (
        <button type="button" className="btn ghost small" onClick={toggle}>
          {running ? "Παύση" : "Συνέχεια χρόνου"}
        </button>
      )}
      <p className="visually-hidden" aria-live="polite">{message}</p>
    </div>
  );
}

export function Clues({ players, round, settings, dispatch, onVote }) {
  const order = turnOrder(players.length, round.start);
  const current = round.clues.length; // position in `order` whose turn it is
  const allDone = current >= order.length;
  const [text, setText] = useState("");
  const [timeUp, setTimeUp] = useState(false);
  const inputId = useId();
  const input = useRef(null);
  const onTimeUp = useRef(() => setTimeUp(true)).current;

  function submit(e) {
    e.preventDefault();
    dispatch({ type: "giveClue", text: text.trim() });
    setText("");
    input.current?.focus();
  }

  const name = (i) => players[order[i]];
  const ready = allDone || timeUp;

  return (
    <Screen
      title={`Γύρος στοιχείων ${round.number}`}
      titleClassName="visually-hidden"
      before={
        <div className="bar">
          <span>Γύρος {round.number}</span>
          {/* everyone sees this bar: in hint-only mode the category would give the imposter extra help */}
          {settings.hintMode !== "hintOnly" && <span>{round.category}</span>}
        </div>
      }
    >
      {settings.timerOn && <Timer total={settings.timerSeconds} onDone={onTimeUp} />}

      {!allDone ? (
        <form className="clue-form" onSubmit={submit}>
          <label htmlFor={inputId} className="field-label">Στοιχείο: {name(current)} <span className="opt">(προαιρετικό)</span></label>
          <div className="add">
            <input
              ref={input}
              id={inputId}
              className="in"
              value={text}
              maxLength={40}
              autoComplete="off"
              enterKeyHint="next"
              placeholder="μία λέξη…"
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn dark next">Επόμενος</button>
          </div>
        </form>
      ) : (
        <p className="sub">Όλοι έδωσαν στοιχείο. Ώρα να ψηφίσετε.</p>
      )}

      <h2 className="label">Σειρά στοιχείων</h2>
      <ol className="order">
        {order.map((p, i) => {
          const done = i < current;
          const now = i === current;
          return (
            <li key={p} className={done ? "done" : now ? "now" : undefined} aria-current={now ? "step" : undefined}>
              <em aria-hidden="true">{i + 1}</em>
              <span>
                {done ? (
                  <>
                    {players[p]}
                    {round.clues[i] ? <> · «{round.clues[i]}»</> : <span className="visually-hidden">, έδωσε στοιχείο</span>}
                  </>
                ) : now ? (
                  <>{players[p]}, σειρά σου</>
                ) : (
                  players[p]
                )}
              </span>
            </li>
          );
        })}
      </ol>


      <div className="grow" />
      <button type="button" className={ready ? "btn" : "btn ghost"} onClick={onVote}>
        Πάμε στην ψηφοφορία
      </button>
    </Screen>
  );
}

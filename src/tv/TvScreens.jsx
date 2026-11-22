import { useEffect, useMemo, useRef, useState } from "react";
import { Screen } from "../components/Screen.jsx";
import { Logo } from "../components/Logo.jsx";
import { turnOrder } from "../game/state.js";
import { useCountdown } from "../lib/useCountdown.js";
import { formatTime, spokenTime } from "../lib/format.js";
import { formatCode, joinLink } from "./code.js";
import { Qr } from "./Qr.jsx";
import { randomLitWindows, windowSprite } from "./windows.js";

// The home screen: the four night scenes crossfade, so lights go on and off in different flats.
export function TvHome({ onNewGame, onHowTo }) {
  return (
    <Screen className="tvs tv-home" title="Ο Imposter" titleClassName="h home-title" before={
      <>
        <div className="tv-scenes" aria-hidden="true">
          <i className="tv-scene s1" /><i className="tv-scene s1 fade" /><i className="tv-scene s2 fade" /><i className="tv-scene s3 fade" /><i className="tv-scene s4 fade" />
        </div>
        <div className="logo"><Logo /></div>
      </>
    }>
      <p className="home-tagline">Όλοι ξέρουν τη λέξη. Εκτός από έναν.</p>
      <div className="grow" />
      <div className="tv-flank">
        <button type="button" className="btn" onClick={onNewGame}>Νέο παιχνίδι</button>
        <button type="button" className="btn ghost" onClick={onHowTo}>Πώς παίζεται</button>
      </div>
    </Screen>
  );
}

export function TvHowTo({ onBack, onNewGame }) {
  return (
    <Screen className="tvs tv-text" title="Πώς παίζεται με TV" before={<div className="tv-redline" />}>
      <ol className="steps">
        <li>Γράψτε τα ονόματα και διαλέξτε κατηγορίες εδώ, στην TV.</li>
        <li>Η TV δείχνει ένα QR και έναν κωδικό. Ο καθένας τον <b>σκανάρει με την κάμερα του κινητού του</b> (ή πατά «Μπες σε γύρο TV» και γράφει τον κωδικό) και διαλέγει το όνομά του. Αυτό γίνεται μία φορά: στους επόμενους γύρους πατάτε «Επόμενος γύρος» στο κινητό.</li>
        <li>Κρατήστε πατημένη την κάρτα στο κινητό. Όλοι βλέπουν τη λέξη, εκτός από τον Imposter, που βλέπει μόνο ένα στοιχείο.</li>
        <li>Με τη σειρά που δείχνει η TV, ο καθένας λέει μία λέξη-στοιχείο. Μετά ψηφίστε φωναχτά.</li>
        <li>Η TV αποκαλύπτει τον Imposter. Αν τον πιάσατε, έχει μία ευκαιρία να βρει τη λέξη και να κλέψει τη νίκη.</li>
      </ol>
      <ul className="tips">
        <li>Τα κινητά δεν συνδέονται με την TV. Κάθε κινητό βγάζει τη δική του κάρτα από τον κωδικό, οπότε δουλεύει και χωρίς ίντερνετ, αφού ανοίξει μία φορά τη σελίδα.</li>
        <li>Με τα βελάκια του τηλεκοντρόλ πηγαίνετε από κουμπί σε κουμπί και με OK το πατάτε.</li>
      </ul>
      <div className="grow" />
      <div className="tv-row">
        <button type="button" className="btn" onClick={onNewGame}>Νέο παιχνίδι</button>
        <button type="button" className="btn ghost" onClick={onBack}>Πίσω</button>
      </div>
    </Screen>
  );
}

// Seat windows: a real lit window from the home scenes per player, different each round.
function SeatWindows({ players, roundNumber, highlight }) {
  const picks = useMemo(() => randomLitWindows(players.length), [players.length, roundNumber]);
  return (
    <ol className="tv-seats" aria-label="Θέσεις">
      {players.map((p, i) => (
        <li key={p} className={highlight === i ? "first" : undefined}>
          <span className={`tv-win s${picks[i].scene}`} style={windowSprite(picks[i].col, picks[i].row)} aria-hidden="true" />
          <span className="plate"><b>{i + 1}</b> {p}</span>
        </li>
      ))}
    </ol>
  );
}

// Step 1 of a round: the code and QR. Each phone works out its own card from them.
export function TvLobby({ players, round, code, onReady, onSettings }) {
  const link = joinLink(code, players, round.number);
  return (
    <Screen className="tvs tv-lobby" title="Νέο παιχνίδι" before={<div className="tv-redline" />}>
      <div className="tv-two">
        <div className="tv-code">
          <p className="label">Κωδικός παιχνιδιού</p>
          <p className="tv-bigcode" aria-label={`Κωδικός: ${code.split("").join(" ")}`}>{formatCode(code)}</p>
          <div className="tv-qrrow">
            <Qr text={link} label="QR για να μπεις στο παιχνίδι" />
            <p className="sub">
              Σκάναρε με την κάμερα του κινητού. Ή πάτα «Μπες σε γύρο TV» στο <b>{location.host}</b> και γράψε τον κωδικό.
              Μία φορά για όλο το παιχνίδι: στους επόμενους γύρους πατάτε «Επόμενος γύρος» στο κινητό.
            </p>
          </div>
        </div>
        <SeatWindows players={players} roundNumber={round.number} />
      </div>
      <div className="tv-row">
        <button type="button" className="btn" onClick={onReady}>Όλοι μπήκαν · Πάμε</button>
        <button type="button" className="btn ghost" onClick={onSettings}>Ρυθμίσεις</button>
      </div>
    </Screen>
  );
}

// The round code in the bottom-right corner of the screens after the lobby, so someone who missed
// the QR (or whose phone went wrong) can still join before the imposter is revealed.
export function CornerCode({ code, round }) {
  return (
    <aside className="tv-corner" aria-label="Κωδικός παιχνιδιού">
      <span className="hint">Έχασες την κάρτα σου; <b>{location.host}</b> · «Μπες σε γύρο TV»</span>
      <span className="code" aria-label={code.split("").join(" ")}>{formatCode(code)}</span>
      <span className="round">Γύρος <b>{round}</b></span>
    </aside>
  );
}

// No category here: on the big screen it would tell the imposter what to look for.
function RoundChips({ round, settings }) {
  return (
    <ul className="tv-chips">
      <li>{round.imposters.length === 1 ? "1 imposter" : `${round.imposters.length} imposters`}</li>
      {settings.timerOn && <li>Χρόνος {formatTime(settings.timerSeconds)}</li>}
    </ul>
  );
}

function Order({ players, round, current = -1 }) {
  const order = turnOrder(players.length, round.start);
  return (
    <ol className="tv-order">
      {order.map((p, i) => (
        <li key={p} className={i < current ? "done" : i === current ? "now" : undefined} aria-current={i === current ? "step" : undefined}>
          <b aria-hidden="true">{i + 1}</b> {players[p]}
          {i < current && <span className="visually-hidden">, έδωσε στοιχείο</span>}
        </li>
      ))}
    </ol>
  );
}

// Step 2: everyone looks at their card at once. The TV can't know who has looked.
// With the timer off there is no separate clue round: this screen is also where the clues are said.
export function TvCards({ players, round, settings, code, onGo }) {
  const first = players[round.start];
  const timed = settings.timerOn;
  const later = round.number > 1;
  const look = later
    ? `Πατήστε «Επόμενος γύρος» στο κινητό και δείτε ότι γράφει «Γύρος ${round.number}». Μην δείξετε την κάρτα σε κανέναν.`
    : "Δείτε την κάρτα σας στο κινητό και μην τη δείξετε σε κανέναν.";
  return (
    <Screen className="tvs tv-cards has-corner" title={timed ? "Κοιτάξτε τις κάρτες σας" : "Κάρτες και στοιχεία"} before={<div className="tv-redline" />}>
      {timed ? (
        <p className="sub">{look} Όταν όλοι είναι έτοιμοι, ξεκινά ο γύρος στοιχείων με χρόνο.</p>
      ) : (
        <ol className="sub tv-steps">
          <li>{look}</li>
          <li>Με τη σειρά από κάτω, ο καθένας λέει δυνατά μία λέξη-στοιχείο.</li>
        </ol>
      )}
      <div className="grow" />
      <p className="tv-starter">Ξεκινά: <strong>{first}</strong></p>
      <Order players={players} round={round} />
      <RoundChips round={round} settings={settings} />
      <div className="grow" />
      <div className="tv-row end">
        <button type="button" className="btn" onClick={onGo}>{timed ? "Όλοι είδαν · Στα στοιχεία" : "Όλοι είπαν · Στην ψηφοφορία"}</button>
      </div>
      <CornerCode code={code} round={round.number} />
    </Screen>
  );
}

const RING_R = 58;
const RING_LEN = 2 * Math.PI * RING_R;

// Step 3 (timer on): the TV is the clock. One clue each, in order; the clues are said out loud.
export function TvClues({ players, round, settings, code, onVote }) {
  const order = turnOrder(players.length, round.start);
  const [current, setCurrent] = useState(0);
  const { left, running, done, toggle } = useCountdown(settings.timerSeconds, true);
  const [message, setMessage] = useState("");
  const prev = useRef(left);
  const allDone = current >= order.length;

  // Announce only at key moments, never every second.
  useEffect(() => {
    const was = prev.current;
    prev.current = left;
    if (was > 60 && left <= 60 && left > 10) setMessage("Απομένει 1 λεπτό.");
    else if (was > 10 && left <= 10 && left > 0) setMessage("Απομένουν 10 δευτερόλεπτα.");
    else if (was > 0 && left === 0) setMessage("Τέλος χρόνου!");
  }, [left]);

  return (
    <Screen className="tvs has-corner" title="Γύρος στοιχείων" before={<div className="tv-redline" />}>
      <div className="tv-clues">
        <div className={`timer tv-timer${done ? " over" : ""}`} role="timer" aria-label="Χρόνος που απομένει">
          <svg viewBox="0 0 132 132" aria-hidden="true">
            <circle cx="66" cy="66" r={RING_R} className="ring-track" />
            <circle cx="66" cy="66" r={RING_R} className="ring-fill" strokeDasharray={RING_LEN} strokeDashoffset={RING_LEN * (1 - left / settings.timerSeconds)} />
          </svg>
          <div>
            <b aria-hidden="true">{formatTime(left)}</b>
            <small aria-hidden="true">{done ? "τέλος χρόνου" : running ? "απομένουν" : "σε παύση"}</small>
            <span className="visually-hidden">{done ? "Τέλος χρόνου" : `${spokenTime(left)}${running ? "" : ", σε παύση"}`}</span>
          </div>
        </div>
        <div className="tv-turn">
          {allDone ? (
            <p className="tv-starter">Όλοι έδωσαν στοιχείο. <strong>Ώρα να ψηφίσετε.</strong></p>
          ) : (
            <p className="tv-starter">Σειρά έχει <strong>{players[order[current]]}</strong></p>
          )}
          <Order players={players} round={round} current={current} />
          <div className="tv-row">
            {!allDone && <button type="button" className="btn" onClick={() => setCurrent((c) => c + 1)}>Επόμενος</button>}
            {!done && <button type="button" className="btn ghost" onClick={toggle}>{running ? "Παύση" : "Συνέχεια χρόνου"}</button>}
            <button type="button" className={allDone || done ? "btn" : "btn ghost"} onClick={onVote}>Στην ψηφοφορία</button>
          </div>
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">{message}</p>
      <CornerCode code={code} round={round.number} />
    </Screen>
  );
}

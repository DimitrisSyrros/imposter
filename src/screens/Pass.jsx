import { Screen } from "../components/Screen.jsx";
import { Dots } from "../components/Dots.jsx";
import { fitStyle } from "../lib/format.js";

// Hands the phone to the next player. Looks the same for every player, imposter or not.
export function Pass({ name, index, total, note, onReady }) {
  return (
    <Screen
      titleClassName="pass"
      title={
        <>
          <span className="hand">Δώσε το κινητό</span>
          <span className="big-name" style={fitStyle(name)}>{name}</span>
        </>
      }
      before={<Dots total={total} current={index} />}
    >
      <p className="sub center">Οι υπόλοιποι, μην κοιτάτε!</p>
      <div className="grow" />
      <p className="privacy">{note}</p>
      <button type="button" className="btn" onClick={onReady}>
        Είμαι η/ο {name}
      </button>
    </Screen>
  );
}

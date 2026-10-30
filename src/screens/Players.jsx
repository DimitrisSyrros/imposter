import { useId, useRef, useState } from "react";
import { Screen } from "../components/Screen.jsx";
import { Bar } from "../components/Bar.jsx";
import { Avatar } from "../components/Avatar.jsx";
import { Stepper } from "../components/Stepper.jsx";
import { MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS, maxImposters } from "../game/state.js";

export function Players({ players, imposters, dispatch, onBack, onNext }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const input = useRef(null);
  const inputId = useId();
  const errorId = useId();
  const full = players.length >= MAX_PLAYERS;
  const enough = players.length >= MIN_PLAYERS;

  function add(e) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) {
      setError("Γράψε ένα όνομα.");
    } else if (players.some((p) => p.toLocaleLowerCase("el") === clean.toLocaleLowerCase("el"))) {
      setError(`Υπάρχει ήδη παίκτης με το όνομα «${clean}».`);
    } else {
      dispatch({ type: "addPlayer", name: clean });
      setName("");
      setError("");
    }
    input.current?.focus();
  }

  function remove(i) {
    dispatch({ type: "removePlayer", index: i });
    input.current?.focus(); // the removed button is gone, so keep focus somewhere useful
  }

  return (
    <Screen title="Ποιοι παίζουν;" before={<Bar onBack={onBack} step="1 / 2" />}>
      {players.length > 0 ? (
        <ul className="players" aria-label={`Παίκτες: ${players.length}`}>
          {players.map((p, i) => (
            <li key={p} className="player">
              <Avatar name={p} index={i} />
              <span className="name">{p}</span>
              <button type="button" className="x" aria-label={`Αφαίρεση: ${p}`} onClick={() => remove(i)}>
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sub">Πρόσθεσε τουλάχιστον {MIN_PLAYERS} παίκτες. Τα ονόματα μένουν στο κινητό για την επόμενη φορά.</p>
      )}

      {full ? (
        <p className="sub">Φτάσατε τους {MAX_PLAYERS} παίκτες, το μέγιστο.</p>
      ) : (
        <form className="add" onSubmit={add} noValidate>
          <label htmlFor={inputId} className="visually-hidden">Όνομα παίκτη</label>
          <input
            ref={input}
            id={inputId}
            className="in"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder="Όνομα παίκτη…"
            autoComplete="off"
            enterKeyHint="done"
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
          />
          <button type="submit" className="plus" aria-label="Προσθήκη παίκτη">
            <span aria-hidden="true">+</span>
          </button>
        </form>
      )}
      <p id={errorId} className="error" role="alert">{error}</p>

      <div className="grow" />
      <Stepper
        label="Imposters"
        value={imposters}
        min={1}
        max={maxImposters(players.length)}
        decLabel="Λιγότεροι imposters"
        incLabel="Περισσότεροι imposters"
        onChange={(v) => dispatch({ type: "updateSettings", patch: { imposters: v } })}
      />
      {!enough && (
        <p className="sub" id="players-need">
          Χρειάζονται ακόμα {MIN_PLAYERS - players.length} για να ξεκινήσετε.
        </p>
      )}
      <button
        type="button"
        className="btn"
        aria-disabled={!enough || undefined}
        aria-describedby={!enough ? "players-need" : undefined}
        onClick={() => enough && onNext()}
      >
        Συνέχεια
      </button>
    </Screen>
  );
}

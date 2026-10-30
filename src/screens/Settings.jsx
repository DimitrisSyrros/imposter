import { useId } from "react";
import { Screen } from "../components/Screen.jsx";
import { Bar } from "../components/Bar.jsx";
import { Stepper } from "../components/Stepper.jsx";
import { categories } from "../lib/words.js";
import { TIMER_MAX, TIMER_MIN, TIMER_STEP } from "../game/state.js";
import { formatTime, spokenTime } from "../lib/format.js";

// Two options as real radio buttons, drawn as a segmented control.
function Segmented({ legend, name, value, options, onChange }) {
  return (
    <fieldset className="seg-field">
      <legend className="label">{legend}</legend>
      <div className="seg">
        {options.map((o) => (
          <label key={o.value}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// A labelled on/off switch. The state is shown as text and by the knob's position, not by colour alone.
function SwitchRow({ label, on, onToggle, describedBy }) {
  const id = useId();
  return (
    <div className="row">
      <span id={id}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={id}
        aria-describedby={describedBy}
        className="switch"
        onClick={onToggle}
      >
        <span className="state">{on ? "Ναι" : "Όχι"}</span>
        <span className="track" aria-hidden="true" />
      </button>
    </div>
  );
}

export function Settings({ settings, dispatch, onBack, onDeal }) {
  const set = (patch) => dispatch({ type: "updateSettings", patch });
  const modeId = useId();
  const selected = new Set(settings.categories);
  const none = selected.size === 0;

  function toggle(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    // keep the order of the word list
    set({ categories: categories.map((c) => c.id).filter((c) => next.has(c)) });
  }

  return (
    <Screen title="Ρυθμίσεις γύρου" before={<Bar onBack={onBack} step="2 / 2" />}>
      <fieldset className="stack">
        <legend className="label">Κατηγορίες</legend>
        <div className="chips">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              aria-pressed={selected.has(c.id)}
              onClick={() => toggle(c.id)}
            >
              <span aria-hidden="true">{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
        <div className="chip-actions">
          <button type="button" className="link" onClick={() => set({ categories: categories.map((c) => c.id) })}>
            Όλες
          </button>
          <button type="button" className="link" onClick={() => set({ categories: [] })}>
            Καμία
          </button>
        </div>
      </fieldset>

      <Segmented
        legend="Τι βλέπει ο Imposter"
        name="hintMode"
        value={settings.hintMode}
        onChange={(v) => set({ hintMode: v })}
        options={[
          { value: "category", label: "Μόνο κατηγορία" },
          { value: "hint", label: "Κατηγορία + στοιχείο" },
          { value: "hintOnly", label: "Μόνο στοιχείο" },
        ]}
      />

      <div className="stack">
        <div className="timerset">
          <SwitchRow label="Κρυφή ψηφοφορία" on={settings.secretVote} describedBy={modeId} onToggle={() => set({ secretVote: !settings.secretVote })} />
          {settings.secretVote && (
            <SwitchRow label="Χρονόμετρο" on={settings.timerOn} onToggle={() => set({ timerOn: !settings.timerOn })} />
          )}
          {settings.secretVote && settings.timerOn && (
            <Stepper
              label="Διάρκεια"
              value={settings.timerSeconds}
              display={<><span aria-hidden="true">{formatTime(settings.timerSeconds)}</span><span className="visually-hidden">{spokenTime(settings.timerSeconds)}</span></>}
              min={TIMER_MIN}
              max={TIMER_MAX}
              step={TIMER_STEP}
              decLabel="Λιγότερος χρόνος"
              incLabel="Περισσότερος χρόνος"
              onChange={(v) => set({ timerSeconds: v })}
            />
          )}
        </div>
        <p id={modeId} className="privacy left">
          {settings.secretVote
            ? "Γύρος στοιχείων στο κινητό και μυστική ψήφος, ένας ένας."
            : "Στοιχεία και ψήφος φωναχτά. Μετά τις κάρτες, το κινητό αποκαλύπτει τον Imposter."}
        </p>
      </div>

      <Segmented
        legend="Εμφάνιση κάρτας"
        name="revealMode"
        value={settings.revealMode}
        onChange={(v) => set({ revealMode: v })}
        options={[
          { value: "hold", label: "Κράτα πατημένο" },
          { value: "tap", label: "Πάτα για εμφάνιση / απόκρυψη" },
        ]}
      />

      <div className="grow" />
      {none && <p className="sub" id="settings-need">Διάλεξε τουλάχιστον μία κατηγορία.</p>}
      <button
        type="button"
        className="btn"
        aria-disabled={none || undefined}
        aria-describedby={none ? "settings-need" : undefined}
        onClick={() => !none && onDeal()}
      >
        Μοίρασε ρόλους
      </button>
    </Screen>
  );
}

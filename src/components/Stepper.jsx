import { useId } from "react";

// A labelled number with − and + buttons. The value is announced when it changes.
export function Stepper({ label, value, display = value, min, max, step = 1, onChange, decLabel, incLabel }) {
  const id = useId();
  return (
    <div className="stepper" role="group" aria-labelledby={id}>
      <span id={id}>{label}</span>
      <span className="ctrl">
        <button type="button" aria-label={decLabel} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>
          <span aria-hidden="true">−</span>
        </button>
        <output aria-live="polite">{display}</output>
        <button type="button" aria-label={incLabel} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
          <span aria-hidden="true">+</span>
        </button>
      </span>
    </div>
  );
}

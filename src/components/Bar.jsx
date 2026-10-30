// Top bar: back button on the left, optional step text on the right.
export function Bar({ onBack, step }) {
  return (
    <div className="bar">
      <button type="button" className="back" onClick={onBack} aria-label="Πίσω">
        <span aria-hidden="true">‹</span>
      </button>
      {step && <span className="step">{step}</span>}
    </div>
  );
}

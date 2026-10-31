// A short, decorative end-of-round animation that plays once and leaves nothing behind.
// "win": the group won, gold fireworks over the facade.
// "lose": the imposter won, the mask peeks up from below, winks and ducks away.
// Hidden from screen readers, never takes a click, and not shown at all with reduced motion.
const SPARKS = 14;

function Burst({ x, y, delay }) {
  return (
    <span className="burst" style={{ "--x": x, "--y": y, "--delay": delay }}>
      {Array.from({ length: SPARKS }, (_, i) => (
        <i key={i} style={{ "--a": `${(360 / SPARKS) * i}deg`, "--d": `${5 + (i % 3) * 1.5}rem` }} />
      ))}
    </span>
  );
}

export function Celebrate({ kind }) {
  return (
    <div className={`celebrate ${kind}`} aria-hidden="true">
      {kind === "win" ? (
        <>
          <Burst x="30%" y="22%" delay="0s" />
          <Burst x="72%" y="16%" delay="0.35s" />
          <Burst x="52%" y="34%" delay="0.7s" />
        </>
      ) : (
        <>
          <Burst x="50%" y="78%" delay="0.55s" />
          <span className="peek">
            <svg viewBox="0 0 64 64" fill="none">
              <path d="M6 22c8-6 44-6 52 0-1 14-9 24-26 24S7 36 6 22Z" />
              <ellipse cx="22" cy="28" rx="6" ry="4" />
              <ellipse className="wink" cx="42" cy="28" rx="6" ry="4" />
              <path className="grin" d="M22 38c6 4 14 4 20 0" />
            </svg>
          </span>
        </>
      )}
    </div>
  );
}

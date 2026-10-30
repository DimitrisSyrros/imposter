// Progress through the players: done, current, still to go. Shape and size mark the current one too.
export function Dots({ total, current }) {
  return (
    <div className="dots" role="img" aria-label={`Παίκτης ${current + 1} από ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < current ? "done" : i === current ? "now" : undefined} />
      ))}
    </div>
  );
}

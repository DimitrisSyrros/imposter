// Colours come from the theme (.mask path / .mask ellipse in global.css).
export function Logo() {
  return (
    <div className="mask" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M6 22c8-6 44-6 52 0-1 14-9 24-26 24S7 36 6 22Z" />
        <ellipse cx="22" cy="28" rx="6" ry="4" />
        <ellipse cx="42" cy="28" rx="6" ry="4" />
      </svg>
    </div>
  );
}

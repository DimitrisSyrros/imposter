export const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// "2 λεπτά και 14 δευτερόλεπτα", for screen readers.
export function spokenTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const parts = [];
  if (m) parts.push(m === 1 ? "1 λεπτό" : `${m} λεπτά`);
  if (sec || !m) parts.push(sec === 1 ? "1 δευτερόλεπτο" : `${sec} δευτερόλεπτα`);
  return parts.join(" και ");
}

// Big type sizes itself so the longest single word fits on one line (see --chars in global.css).
export function fitStyle(text) {
  const longest = Math.max(1, ...text.split(/\s+/).map((t) => t.length));
  return { "--chars": longest };
}

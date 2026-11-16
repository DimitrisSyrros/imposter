// Arrow keys move focus to the nearest control in that direction, so a TV remote's D-pad works
// (most TV browsers send arrow keys and Enter). Tab and a mouse keep working as usual.
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]';
const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

function centre(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

function onKey(e) {
  const dir = DIRS[e.key];
  if (!dir || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const from = document.activeElement;
  // Left and right still move the caret inside a text field; radios keep their own arrow keys.
  if (from?.tagName === "INPUT" && (from.type === "radio" || (dir[0] !== 0 && from.type !== "button"))) return;

  // Nothing focused yet (a fresh page): start at the first control on the screen.
  if (!from || from === document.body) {
    const first = [...document.querySelectorAll(FOCUSABLE)].find((el) => el.offsetParent);
    if (first) {
      e.preventDefault();
      first.focus();
    }
    return;
  }
  const origin = centre(from);
  let best = null;
  let bestScore = Infinity;
  for (const el of document.querySelectorAll(FOCUSABLE)) {
    if (el === from || !el.offsetParent) continue;
    const c = centre(el);
    const dx = c.x - origin.x;
    const dy = c.y - origin.y;
    const along = dx * dir[0] + dy * dir[1]; // distance in the arrow's direction
    if (along <= 4) continue;
    const across = Math.abs(dx * dir[1] + dy * dir[0]); // sideways drift, weighted so straight lines win
    const score = along + across * 2.5;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  if (best) {
    e.preventDefault();
    best.focus();
    best.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

export function enableSpatialNav() {
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}

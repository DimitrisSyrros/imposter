import { useMemo } from "react";
import { COLS, COVERED, GLASS_ROWS, GLASS_W, LIT, SCENE_H } from "../tv/windows.js";

// The phone's end of round, the same show as the TV's (TvEnd.jsx) on a portrait slice of its building
// (src/assets/end-building.webp: the four middle columns of TV scene 1, x 470–1206).
// "win":  the dark flats light up from the middle outwards and gold fireworks go off.
// "lose": the lights go out flat by flat until only the red window is left; the red mask peeks up and winks.
// Decorative only: hidden from screen readers, never takes a tap. With reduced motion the final
// picture shows straight away (global.css).
const CROP_X = 470;
const CROP_W = 736;
const FIRST_COL = 3;
const LAST_COL = 6;
const SCENE_LIT = LIT[1].map(([c, r]) => `${c},${r}`);
const RED = "5,3";
const COLOURS = [
  ["#ffd27a", "#f2a43a"], ["#ffd27a", "#f2a43a"], ["#ffc46a", "#e8763a"], ["#ffd27a", "#f2a43a"],
  ["#8fd8ff", "#3a7cff"], ["#9ff0e6", "#25b5aa"], ["#e2a6ff", "#9b4dff"], ["#c8f59a", "#5fbf3a"], ["#ff9a7a", "#e0452f"],
];
const SPARKS = 14;

// Box of a window's glass as percentages of the slice.
function glass(col, row) {
  const [top, bottom] = GLASS_ROWS[row - 1];
  return {
    left: `${((COLS[col - 1] - GLASS_W / 2 - CROP_X) / CROP_W) * 100}%`,
    top: `${(top / SCENE_H) * 100}%`,
    width: `${(GLASS_W / CROP_W) * 100}%`,
    height: `${((bottom - top) / SCENE_H) * 100}%`,
  };
}

function Burst({ x, y, delay }) {
  return (
    <span className="burst" style={{ "--x": x, "--y": y, "--delay": delay }}>
      {Array.from({ length: SPARKS }, (_, i) => (
        <i key={i} style={{ "--a": `${(360 / SPARKS) * i}deg`, "--d": `${4.5 + (i % 3) * 1.25}rem` }} />
      ))}
    </span>
  );
}

export function BuildingEnd({ kind }) {
  const layers = useMemo(() => {
    if (kind === "win") {
      const out = [];
      for (let row = 1; row <= 4; row++) {
        for (let col = FIRST_COL; col <= LAST_COL; col++) {
          const key = `${col},${row}`;
          if (SCENE_LIT.includes(key) || COVERED.includes(key)) continue;
          const delay = 0.2 + Math.hypot(col - 4.5, (row - 2.5) * 1.6) * 0.32 + Math.random() * 0.15;
          const [c1, c2] = COLOURS[Math.floor(Math.random() * COLOURS.length)];
          out.push(<i key={key} className="glow" style={{ ...glass(col, row), "--d": `${delay.toFixed(2)}s`, "--c1": c1, "--c2": c2 }} />);
        }
      }
      return out;
    }
    const out = SCENE_LIT.filter((k) => k !== RED).map((key, i) => {
      const [col, row] = key.split(",").map(Number);
      return <i key={key} className="off" style={{ ...glass(col, row), "--d": `${0.3 + i * 0.4}s` }} />;
    });
    const [col, row] = RED.split(",").map(Number);
    out.push(<i key="red" className="red" style={glass(col, row)} />);
    return out;
  }, [kind]);

  const bursts = kind === "win"
    ? [["22%", "14%", "1.5s"], ["76%", "10%", "1.85s"], ["50%", "30%", "2.2s"], ["30%", "48%", "2.6s"], ["70%", "44%", "2.9s"]]
    : [["58.5%", "52%", "2.3s"]];

  return (
    <div className={`bend ${kind}`} aria-hidden="true">
      <div className="bend-scene" />
      <div className="layer">{layers}</div>
      <div className="layer fx">
        {bursts.map(([x, y, d]) => <Burst key={x + y} x={x} y={y} delay={d} />)}
      </div>
      {kind === "lose" && (
        <span className="peek bend-peek">
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M6 22c8-6 44-6 52 0-1 14-9 24-26 24S7 36 6 22Z" />
            <ellipse cx="22" cy="28" rx="6" ry="4" />
            <ellipse className="wink" cx="42" cy="28" rx="6" ry="4" />
            <path className="grin" d="M22 38c6 4 14 4 20 0" />
          </svg>
        </span>
      )}
    </div>
  );
}

import { useMemo } from "react";
import { COVERED, LIT, glassBox } from "./windows.js";

// The building reacts to the result (scene 1 of the TV home).
// "win":  the dark flats light up from the middle outwards and gold fireworks go off.
// "lose": the lights go out flat by flat until only the red window is left; the red mask peeks up and winks.
// Decorative only: hidden from screen readers, never takes a click. With reduced motion the
// final picture shows straight away (tv.css).
const SCENE_LIT = LIT[1].map(([c, r]) => `${c},${r}`);
const RED = "5,3";
const COLOURS = [
  ["#ffd27a", "#f2a43a"], ["#ffd27a", "#f2a43a"], ["#ffc46a", "#e8763a"], ["#ffd27a", "#f2a43a"],
  ["#8fd8ff", "#3a7cff"], ["#9ff0e6", "#25b5aa"], ["#e2a6ff", "#9b4dff"], ["#c8f59a", "#5fbf3a"], ["#ff9a7a", "#e0452f"],
];
const SPARKS = 16;

function Burst({ x, y, delay }) {
  return (
    <span className="burst" style={{ "--x": x, "--y": y, "--delay": delay }}>
      {Array.from({ length: SPARKS }, (_, i) => (
        <i key={i} style={{ "--a": `${(360 / SPARKS) * i}deg`, "--d": `${9 + (i % 3) * 2.5}vmin` }} />
      ))}
    </span>
  );
}

export function TvEnd({ kind }) {
  const layers = useMemo(() => {
    if (kind === "win") {
      const out = [];
      for (let row = 1; row <= 4; row++) {
        for (let col = 1; col <= 8; col++) {
          const key = `${col},${row}`;
          if (SCENE_LIT.includes(key) || COVERED.includes(key)) continue;
          const delay = 0.2 + Math.hypot(col - 4.5, (row - 2.5) * 1.6) * 0.28 + Math.random() * 0.15;
          const [c1, c2] = COLOURS[Math.floor(Math.random() * COLOURS.length)];
          out.push(<i key={key} className="glow" style={{ ...glassBox(col, row), "--d": `${delay.toFixed(2)}s`, "--c1": c1, "--c2": c2 }} />);
        }
      }
      return out;
    }
    const out = SCENE_LIT.filter((k) => k !== RED).map((key, i) => {
      const [col, row] = key.split(",").map(Number);
      return <i key={key} className="off" style={{ ...glassBox(col, row), "--d": `${0.3 + i * 0.4}s` }} />;
    });
    const [col, row] = RED.split(",").map(Number);
    out.push(<i key="red" className="red" style={glassBox(col, row)} />);
    return out;
  }, [kind]);

  const bursts = kind === "win"
    ? [["24%", "24%", "1.5s"], ["74%", "18%", "1.85s"], ["50%", "40%", "2.2s"], ["36%", "58%", "2.6s"], ["64%", "52%", "2.9s"]]
    : [["55.6%", "50%", "2.3s"]];

  return (
    <div className={`tv-end ${kind}`} aria-hidden="true">
      <div className="tv-scene s1" />
      <div className="layer">{layers}</div>
      <div className="layer fx">
        {bursts.map(([x, y, d]) => <Burst key={x + y} x={x} y={y} delay={d} />)}
      </div>
      {kind === "lose" && (
        <span className="peek tv-peek">
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

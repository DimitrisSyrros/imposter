// Colours from the mockup, cycled by seat. All pass 4.5:1 with the dark initial.
const COLOURS = ["#ffc94a", "#57e3b4", "#8fb6ff", "#ff9ec7", "#c7a6ff"];

export function Avatar({ name, index }) {
  return (
    <span className="av" aria-hidden="true" style={{ background: COLOURS[index % COLOURS.length] }}>
      {name.trim().charAt(0).toLocaleUpperCase("el")}
    </span>
  );
}

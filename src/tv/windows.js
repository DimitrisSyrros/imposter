// Where the windows are in the four TV home scenes (src/assets/tv-home-*.webp, 1672×941).
// All four scenes share the same building; only which windows are lit changes.
export const SCENE_W = 1672;
export const SCENE_H = 941;
export const COLS = [212, 395, 573, 748, 920, 1102, 1282, 1465]; // window centres, x
// Window frame (for cropping a whole window) and glass (for lighting one) per row, y from–to
export const FRAME_ROWS = [[8, 165], [185, 362], [380, 560], [578, 755]];
export const GLASS_ROWS = [[30, 150], [207, 345], [402, 545], [600, 740]];
export const FRAME_W = 132;
export const GLASS_W = 88;

// Lit windows per scene as [column, row], counted from 1. The bottom middle ones are left out:
// the onlookers stand in front of them.
export const LIT = {
  1: [[3, 2], [6, 2], [3, 3], [5, 3], [6, 3]],
  2: [[3, 1], [8, 1], [2, 2], [5, 2], [3, 3], [6, 3], [7, 4]],
  3: [[3, 1], [8, 1], [1, 2], [6, 2], [2, 3], [4, 3], [8, 3], [6, 4]],
  4: [[2, 1], [7, 1], [3, 2], [5, 2], [7, 2], [2, 3], [3, 3], [5, 3], [6, 3]],
};

// Windows that something stands in front of (a lamp or the onlookers): never light these up.
export const COVERED = ["1,4", "4,4", "5,4", "8,4"];

// Box of a window as percentages of the scene, for absolutely positioned overlays.
export function glassBox(col, row) {
  const x = COLS[col - 1] - GLASS_W / 2;
  const [top, bottom] = GLASS_ROWS[row - 1];
  return {
    left: `${(x / SCENE_W) * 100}%`,
    top: `${(top / SCENE_H) * 100}%`,
    width: `${(GLASS_W / SCENE_W) * 100}%`,
    height: `${((bottom - top) / SCENE_H) * 100}%`,
  };
}

// CSS background that shows one whole window of a scene in a box of FRAME_W:height proportions.
export function windowSprite(col, row) {
  const x = COLS[col - 1] - FRAME_W / 2;
  const [y, bottom] = FRAME_ROWS[row - 1];
  const h = bottom - y;
  return {
    backgroundSize: `${(SCENE_W / FRAME_W) * 100}% ${(SCENE_H / h) * 100}%`,
    backgroundPosition: `${(x / (SCENE_W - FRAME_W)) * 100}% ${(y / (SCENE_H - h)) * 100}%`,
  };
}

// `count` different lit windows at random: [{ scene, col, row }]
export function randomLitWindows(count) {
  const pool = Object.entries(LIT).flatMap(([scene, list]) => list.map(([col, row]) => ({ scene: Number(scene), col, row })));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}

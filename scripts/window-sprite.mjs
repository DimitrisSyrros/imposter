// Cuts every lit window out of the four TV home scenes into one small sprite (src/assets/windows-lit.webp),
// so phones can show real windows without loading the full scenes. Run: node scripts/window-sprite.mjs
import sharp from "sharp";
import { COLS, FRAME_ROWS, FRAME_W, LIT } from "../src/tv/windows.js";

const CELL_W = 132, CELL_H = 176, PER_ROW = 8;
const cells = Object.entries(LIT).flatMap(([scene, list]) => list.map(([col, row]) => ({ scene, col, row })));
const tiles = await Promise.all(cells.map(async ({ scene, col, row }, i) => {
  const [top, bottom] = FRAME_ROWS[row - 1];
  const input = await sharp(`src/assets/tv-home-${scene}.webp`)
    .extract({ left: COLS[col - 1] - FRAME_W / 2, top, width: FRAME_W, height: bottom - top })
    .resize(CELL_W, CELL_H, { fit: "cover" })
    .toBuffer();
  return { input, left: (i % PER_ROW) * CELL_W, top: Math.floor(i / PER_ROW) * CELL_H };
}));
const rows = Math.ceil(cells.length / PER_ROW);
await sharp({ create: { width: PER_ROW * CELL_W, height: rows * CELL_H, channels: 3, background: "#0d1619" } })
  .composite(tiles).webp({ quality: 74 }).toFile("src/assets/windows-lit.webp");
console.log(`${cells.length} windows, ${PER_ROW}×${rows} grid`);

import data from "../data/words-el.json";
import { load, save } from "./storage.js";

export const categories = data.categories.map(({ id, name, icon }) => ({ id, name, icon }));

// Picks a word not used yet from the selected categories. When they run out,
// resets the used words for those categories only.
export function nextWord(selectedIds) {
  const pool = data.categories
    .filter((c) => selectedIds.includes(c.id))
    .flatMap((c) => c.words.map((w) => ({ ...w, category: c.name })));
  let used = load("usedWords", []);
  if (!Array.isArray(used)) used = [];
  let left = pool.filter((p) => !used.includes(p.word));
  if (left.length === 0) {
    const inPool = new Set(pool.map((p) => p.word));
    used = used.filter((w) => !inPool.has(w));
    left = pool;
  }
  const pick = left[Math.floor(Math.random() * left.length)];
  save("usedWords", [...used, pick.word]);
  return pick; // { word, hint, category }
}

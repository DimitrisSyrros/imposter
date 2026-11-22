// The TV game code. With no backend, the TV and the phones never talk: the TV shows an 11-digit code
// (and a QR link holding it) once per game, and every phone works out each round's card from it.
//
// Layout of the 11 digits:  V PPPPPPPPP C
//   V  word-list version (data.version % 10), so a phone with an older cached list says so
//   P  the game, scrambled: selected categories, hint mode, player and imposter count, and where the
//      TV's word deck starts (deck number + position)
//   C  check digit over the first 10, so a mistyped code fails instead of dealing a wrong card
//
// No repeats: the TV walks a shuffled deck of every word (the same order on every device) and keeps
// its place across games, taking only words from the selected categories. Round r of a game is the
// r-th such word from the game's start, so a phone only needs the code and the round number.
// The imposters and the first player of each round come from the code and the round number too.
import data from "../data/words-el.json";
import { maxImposters, MAX_PLAYERS, MIN_PLAYERS } from "../game/state.js";

// Every word in the order of the list, with its category.
export const WORDS = data.categories.flatMap((c, ci) =>
  c.words.map((w) => ({ word: w.word, hint: w.hint, category: c.name, categoryId: c.id, cat: ci })),
);
const CATEGORY_IDS = data.categories.map((c) => c.id);

const VERSION = data.version % 10;
const HINT_MODES = ["category", "hint", "hintOnly"];
const SPACE = 1_000_000_000n; // 9 digits
// Scrambles the payload so nearby games don't give nearby codes (A is coprime with 10).
const MIX_A = 765_432_101n;
const MIX_B = 314_159_265n;
const MIX_A_INV = modInverse(MIX_A, SPACE);

// Player count and imposter count pairs.
const SIZES = [];
for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) for (let k = 1; k <= maxImposters(n); k++) SIZES.push([n, k]);

const W = WORDS.length;
const CATEGORY_SETS = 2 ** CATEGORY_IDS.length - 1; // every non-empty selection
const PER_DECK = BigInt(W * CATEGORY_SETS * HINT_MODES.length * SIZES.length);
export const DECKS = Number(SPACE / PER_DECK); // how many different deck orders fit in the code

if (CATEGORY_IDS.length > 12 || DECKS < 2) throw new Error("Game code space too small for the word list");

function modInverse(a, m) {
  let [r0, r1, t0, t1] = [m, a % m, 0n, 1n];
  while (r1) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [t0, t1] = [t1, t0 - q * t1];
  }
  return ((t0 % m) + m) % m;
}

// Weighted mod-10 check: catches any single wrong digit and most swapped neighbours.
function checkDigit(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) sum += Number(digits[i]) * (i % 2 ? 3 : 7);
  return String((10 - (sum % 10)) % 10);
}

// Small seeded random numbers (mulberry32), so the TV and the phones draw the same values.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function shuffle(list, random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Deck d: every word index in a fixed shuffled order, the same on every device.
const deckCache = new Map();
function deck(d) {
  if (!deckCache.has(d)) deckCache.set(d, shuffle(WORDS.map((_, i) => i), rng(hashString(`deck-${VERSION}-${d}`))));
  return deckCache.get(d);
}

// From a deck place { deck, pos }, the next word in the selected categories (a bitmask), and the
// place right after it. At the end of a deck the walk goes on into the next one.
function nextInDeck({ deck: d, pos }, mask) {
  for (let step = 0; step < W * DECKS; step++) {
    if (pos >= W) { d = (d + 1) % DECKS; pos = 0; }
    const w = deck(d)[pos++];
    if (mask & (1 << WORDS[w].cat)) return { word: w, after: { deck: d, pos } };
  }
  throw new Error("No words in the selected categories");
}

// Where a TV with no saved place starts: a random deck and position.
export function randomDeckPlace() {
  return { deck: Math.floor(Math.random() * DECKS), pos: Math.floor(Math.random() * W) };
}

export function isDeckPlace(p) {
  return p && Number.isInteger(p.deck) && Number.isInteger(p.pos) && p.deck >= 0 && p.deck < DECKS && p.pos >= 0 && p.pos <= W;
}

// game: { categories (ids), hintMode, players (count), imposters (count), start: { deck, pos } } → "40312876551"
export function encodeGame({ categories, hintMode, players: n, imposters: k, start }) {
  const mask = categories.reduce((m, id) => m | (1 << CATEGORY_IDS.indexOf(id)), 0);
  const size = SIZES.findIndex(([sn, sk]) => sn === n && sk === k);
  const hint = HINT_MODES.indexOf(hintMode);
  if (!mask || categories.some((id) => !CATEGORY_IDS.includes(id)) || size < 0 || hint < 0 || !isDeckPlace(start)) {
    throw new Error("Game cannot be encoded");
  }
  const pos = start.pos % W; // a place at the very end of a deck is the start of the next
  const d = start.pos >= W ? (start.deck + 1) % DECKS : start.deck;
  let payload = BigInt(d) * BigInt(W) + BigInt(pos);
  payload = payload * BigInt(CATEGORY_SETS) + BigInt(mask - 1);
  payload = payload * BigInt(HINT_MODES.length) + BigInt(hint);
  payload = payload * BigInt(SIZES.length) + BigInt(size);
  const mixed = (payload * MIX_A + MIX_B) % SPACE;
  const body = `${VERSION}${String(mixed).padStart(9, "0")}`;
  return body + checkDigit(body);
}

// "403 1287 6551" → { ok: true, game } or { ok: false, error: "length" | "check" | "version" }.
// game: { code, mask, categories, hintMode, players, imposters, start }
export function decodeGame(input) {
  const code = String(input).replace(/\D/g, "");
  if (code.length !== 11) return { ok: false, error: "length" };
  if (checkDigit(code.slice(0, 10)) !== code[10]) return { ok: false, error: "check" };
  if (Number(code[0]) !== VERSION) return { ok: false, error: "version" };
  let payload = (((BigInt(code.slice(1, 10)) - MIX_B + SPACE) % SPACE) * MIX_A_INV) % SPACE;
  const take = (base) => {
    const v = Number(payload % BigInt(base));
    payload /= BigInt(base);
    return v;
  };
  const size = take(SIZES.length);
  const hint = take(HINT_MODES.length);
  const mask = take(CATEGORY_SETS) + 1;
  const pos = take(W);
  const d = Number(payload);
  if (d >= DECKS) return { ok: false, error: "check" };
  const [n, k] = SIZES[size];
  return {
    ok: true,
    game: {
      code,
      mask,
      categories: CATEGORY_IDS.filter((_, i) => mask & (1 << i)),
      hintMode: HINT_MODES[hint],
      players: n,
      imposters: k,
      start: { deck: d, pos },
    },
  };
}

// Round r (from 1) of a game: { number, word, hint, category, hintMode, players, imposters (seats), start, after }.
// `after` is the deck place right after this round's word, where the TV continues from.
export function gameRound(game, r) {
  let place = game.start;
  let pick;
  for (let i = 0; i < r; i++) {
    pick = nextInDeck(place, game.mask);
    place = pick.after;
  }
  const w = WORDS[pick.word];
  const random = rng(hashString(`${game.code}-${r}`));
  const seats = shuffle(Array.from({ length: game.players }, (_, i) => i), random);
  return {
    number: r,
    word: w.word,
    hint: w.hint,
    category: w.category,
    hintMode: game.hintMode,
    players: game.players,
    imposters: seats.slice(0, game.imposters).sort((a, b) => a - b),
    start: Math.floor(random() * game.players), // the player who looks first and gives the first clue
    after: place,
  };
}

// "40312876551" → "403 1287 6551"
export const formatCode = (code) => {
  const d = code.replace(/\D/g, "");
  return [d.slice(0, 3), d.slice(3, 7), d.slice(7, 11)].filter(Boolean).join(" ");
};

// The link in the TV's QR: the phone's own camera opens it, and the app reads the hash.
// `round` lets someone who scans late land on the round being played.
export function joinLink(code, names, round = 1) {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#j=${code}&r=${round}&n=${encodeURIComponent(names.join("\n"))}`;
}

// Reads "#j=…&r=…&n=…" from a URL hash. Returns null when it isn't a join link.
export function readJoinHash(hash) {
  if (!hash.startsWith("#j=")) return null;
  const params = new URLSearchParams(hash.slice(1));
  const code = (params.get("j") || "").replace(/\D/g, "");
  const round = Math.max(1, Math.floor(Number(params.get("r"))) || 1);
  const raw = params.get("n");
  const names = raw ? raw.split("\n").map((s) => s.trim()).filter(Boolean) : null;
  return { code, round, names };
}

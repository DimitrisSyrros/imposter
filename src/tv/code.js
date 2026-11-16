// The TV round code. With no backend, the TV and the phones never talk: the TV deals the round
// and shows a 9-digit code (and a QR link holding it), and each phone works out its own card from it.
//
// Layout of the 9 digits:  V PPPPPPP C
//   V  word-list version (data.version % 10), so a phone with an older cached list says so
//   P  the round, scrambled: word, hint mode, player count and which seats are imposters
//   C  check digit over the first 8, so a mistyped code fails instead of dealing a wrong card
import data from "../data/words-el.json";
import { maxImposters, MAX_PLAYERS, MIN_PLAYERS } from "../game/state.js";

// Every word in the order of the list, with its category.
export const WORDS = data.categories.flatMap((c) =>
  c.words.map((w) => ({ word: w.word, hint: w.hint, category: c.name, categoryId: c.id })),
);

const VERSION = data.version % 10;
const HINT_MODES = ["category", "hint", "hintOnly"];
const WORD_SLOTS = 600; // room for the list to grow; the version digit changes when it does
const SPACE = 10_000_000; // 7 digits
// Scrambles the payload so nearby rounds don't give nearby codes (A is coprime with 10).
const MIX_A = 7_654_321;
const MIX_B = 3_141_592;
const MIX_A_INV = modInverse(MIX_A, SPACE);

// All valid seatings: player count n and a bitmask of imposter seats, at most maxImposters(n) of them.
const SEATINGS = [];
const SEATING_INDEX = new Map();
for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
  for (let mask = 1; mask < 1 << n; mask++) {
    const k = popcount(mask);
    if (k <= maxImposters(n)) {
      SEATING_INDEX.set(n * 4096 + mask, SEATINGS.length);
      SEATINGS.push([n, mask]);
    }
  }
}

if (WORDS.length > WORD_SLOTS || WORD_SLOTS * HINT_MODES.length * SEATINGS.length > SPACE) {
  throw new Error("Round code space too small for the word list");
}

function popcount(x) {
  let c = 0;
  for (; x; x &= x - 1) c++;
  return c;
}

function modInverse(a, m) {
  let [r0, r1, t0, t1] = [m, a % m, 0, 1];
  while (r1) {
    const q = Math.floor(r0 / r1);
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

// Index of a picked word ({ word, category }) in WORDS.
export function wordIndex(pick) {
  return WORDS.findIndex((w) => w.word === pick.word && w.category === pick.category);
}

// round: { wordIndex, hintMode, players (count), imposters (seat indexes) } → "482177309"
export function encodeRound({ wordIndex: w, hintMode, players: n, imposters }) {
  const mask = imposters.reduce((m, i) => m | (1 << i), 0);
  const seating = SEATING_INDEX.get(n * 4096 + mask);
  const hint = HINT_MODES.indexOf(hintMode);
  if (w < 0 || seating === undefined || hint < 0) throw new Error("Round cannot be encoded");
  const payload = (w * HINT_MODES.length + hint) * SEATINGS.length + seating;
  const mixed = (payload * MIX_A + MIX_B) % SPACE; // < 2^53 for any payload < SPACE
  const body = `${VERSION}${String(mixed).padStart(7, "0")}`;
  return body + checkDigit(body);
}

// "482 177 309" → { ok: true, round } or { ok: false, error: "length" | "check" | "version" }.
// round: { word, hint, category, hintMode, players, imposters }
export function decodeRound(input) {
  const code = String(input).replace(/\D/g, "");
  if (code.length !== 9) return { ok: false, error: "length" };
  if (checkDigit(code.slice(0, 8)) !== code[8]) return { ok: false, error: "check" };
  if (Number(code[0]) !== VERSION) return { ok: false, error: "version" };
  const mixed = Number(code.slice(1, 8));
  const payload = ((mixed - MIX_B + SPACE) * MIX_A_INV) % SPACE; // < 2^53
  const seating = payload % SEATINGS.length;
  const rest = Math.floor(payload / SEATINGS.length);
  const hint = rest % HINT_MODES.length;
  const w = Math.floor(rest / HINT_MODES.length);
  if (w >= WORDS.length) return { ok: false, error: "check" };
  const [n, mask] = SEATINGS[seating];
  const imposters = [];
  for (let i = 0; i < n; i++) if (mask & (1 << i)) imposters.push(i);
  const { word, hint: wordHint, category } = WORDS[w];
  return { ok: true, round: { word, hint: wordHint, category, hintMode: HINT_MODES[hint], players: n, imposters } };
}

// "482177309" → "482 177 309"
export const formatCode = (code) => code.replace(/(\d{3})(?=\d)/g, "$1 ");

// The link in the TV's QR: the phone's own camera opens it, and the app reads the hash.
export function joinLink(code, names) {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#j=${code}&n=${encodeURIComponent(names.join("\n"))}`;
}

// Reads "#j=…&n=…" from a URL hash. Returns null when it isn't a join link.
export function readJoinHash(hash) {
  if (!hash.startsWith("#j=")) return null;
  const params = new URLSearchParams(hash.slice(1));
  const code = (params.get("j") || "").replace(/\D/g, "");
  const raw = params.get("n");
  const names = raw ? raw.split("\n").map((s) => s.trim()).filter(Boolean) : null;
  return { code, names };
}

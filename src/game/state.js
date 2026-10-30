import { categories, nextWord } from "../lib/words.js";
import { load } from "../lib/storage.js";

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MAX_NAME_LENGTH = 32;
export const TIMER_STEP = 30;
export const TIMER_MIN = 60;
export const TIMER_MAX = 600;

export const defaultSettings = {
  categories: categories.map((c) => c.id),
  hintMode: "hint", // "category" (category only) | "hint" (category + hint) | "hintOnly" (hint only)
  timerOn: true,
  timerSeconds: 180,
  revealMode: "hold", // "hold" | "tap"
  secretVote: false, // on: clue round + secret vote on the phone; off: talk and vote out loud, then reveal
  imposters: 1,
};

// Imposters must stay fewer than the rest of the group.
export function maxImposters(playerCount) {
  return Math.max(1, Math.ceil(playerCount / 2) - 1);
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Stored values may be missing, from an older version or hand-edited: keep only what is valid.
function loadSettings() {
  const saved = load("settings", {});
  const s = { ...defaultSettings, ...(saved && typeof saved === "object" ? saved : {}) };
  const ids = new Set(categories.map((c) => c.id));
  s.categories = Array.isArray(s.categories) ? s.categories.filter((id) => ids.has(id)) : defaultSettings.categories;
  if (!["category", "hint", "hintOnly"].includes(s.hintMode)) s.hintMode = "hint";
  if (s.revealMode !== "tap") s.revealMode = "hold";
  s.timerOn = s.timerOn !== false;
  s.secretVote = s.secretVote === true;
  s.timerSeconds = clamp(Number(s.timerSeconds) || defaultSettings.timerSeconds, TIMER_MIN, TIMER_MAX);
  s.imposters = Math.max(1, Math.floor(Number(s.imposters)) || 1);
  return s;
}

function loadPlayers() {
  const saved = load("players", []);
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((p) => typeof p === "string" && p.trim())
    .map((p) => p.trim().slice(0, MAX_NAME_LENGTH))
    .filter((p, i, all) => all.findIndex((q) => q.toLocaleLowerCase("el") === p.toLocaleLowerCase("el")) === i)
    .slice(0, MAX_PLAYERS);
}

export function initState() {
  return {
    screen: "home",
    players: loadPlayers(),
    settings: loadSettings(),
    round: null,
  };
}

// Builds a round outside the reducer, because it is random and writes the used words.
// Clue order: seating order, starting from the round's random player.
export function clueOrder(playerCount, start) {
  return Array.from({ length: playerCount }, (_, i) => (start + i) % playerCount);
}

export function createRound(players, settings, number = 1) {
  const n = players.length;
  const pick = nextWord(settings.categories);
  const count = clamp(settings.imposters, 1, maxImposters(n));
  const shuffled = players.map((_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return {
    number,
    word: pick.word,
    hint: pick.hint,
    category: pick.category,
    imposters: shuffled.slice(0, count).sort((a, b) => a - b),
    clueStart: Math.floor(Math.random() * n), // clue order: seating order from a random player
    revealIndex: 0,
    clues: [], // clues[i] = what the i-th player in clue order said (may be empty)
    votes: [], // votes[voter] = index of the player they picked; players vote in seating order
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case "go":
      return { ...state, screen: action.screen };

    case "addPlayer": {
      if (state.players.length >= MAX_PLAYERS) return state;
      return { ...state, players: [...state.players, action.name] };
    }
    case "removePlayer": {
      const players = state.players.filter((_, i) => i !== action.index);
      const imposters = Math.min(state.settings.imposters, maxImposters(players.length));
      return { ...state, players, settings: { ...state.settings, imposters } };
    }
    case "updateSettings":
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case "deal":
      return { ...state, round: action.round, screen: "pass" };

    case "showCard":
      return { ...state, screen: "reveal" };

    case "nextPlayer": {
      const next = state.round.revealIndex + 1;
      if (next < state.players.length) {
        return { ...state, round: { ...state.round, revealIndex: next }, screen: "pass" };
      }
      return { ...state, screen: state.settings.secretVote ? "clues" : "unmask" };
    }

    case "giveClue": {
      if (state.round.clues.length >= state.players.length) return state;
      return { ...state, round: { ...state.round, clues: [...state.round.clues, action.text] } };
    }

    case "startVote":
      return { ...state, round: { ...state.round, votes: [] }, screen: "votePass" };

    case "readyToVote":
      return { ...state, screen: "vote" };

    case "castVote": {
      const votes = [...state.round.votes, action.target];
      const done = votes.length >= state.players.length;
      return { ...state, round: { ...state.round, votes }, screen: done ? "result" : "votePass" };
    }

    default:
      return state;
  }
}

// Counts the votes. The imposters are caught only when one player has the most votes
// on their own and is an imposter; a tie or a wrong pick lets the imposters get away.
export function verdict(playerCount, round) {
  const counts = Array(playerCount).fill(0);
  round.votes.forEach((v) => counts[v]++);
  const max = Math.max(...counts);
  const top = counts.flatMap((c, i) => (c === max && c > 0 ? [i] : []));
  const caught = top.length === 1 && round.imposters.includes(top[0]) ? top[0] : null;
  return { counts, top, caught };
}

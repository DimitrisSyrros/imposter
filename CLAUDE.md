# Ο Imposter

A free, pass-the-phone party word game for friends, in Greek. Built as a React PWA and hosted on a public URL. It's non-commercial and has no accounts or backend.

## What's in this folder

- `data/words-el.json`: the word list. 12 categories, 474 words (40 per category, 34 in Διάσημοι), each with a hint for the imposter.
- `src/`: the app itself. It is the reference for the layout and the look of every screen.
- `CLAUDE.md`: this brief.

## Core idea

Everyone except the imposter gets the same secret word. Players take turns giving a one-word clue, then vote on who the imposter is. If the imposter is caught, they get one last chance to guess the word and steal the win.

One phone is passed around the table. Everything runs in the browser on that phone.

## Decisions already made

- **Name:** "Ο Imposter". Use an original logo, art and sounds. Don't use anything from Among Us, Spyfall or The Chameleon.
- **Language:** all UI text in Greek.
- **No backend.** No accounts, analytics or server. The app works fully offline once installed. Every phone that opens the site runs its own independent game.
- **Storage:** `localStorage` only, for player names, settings and used words. Wrap every read and write in try/catch, and make the app work if storage is empty or blocked.
- **Imposter screen must look identical to a normal player's screen.** Use the same background, card colour, card angle, layout and buttons, so the phone's glow on someone's face gives nothing away. Only the text differs:
  - Normal player: "Η λέξη σου" + the word.
  - Imposter: "Είσαι ο Imposter" + the category, plus the hint if hints are on, plus a short "bluff" line.
  - Known limitation: at normal text sizes and in landscape the two cards are exactly the same size. At 200% browser zoom or 200% OS text they are not, because the imposter's text needs more room (for example about 305×615 px for a word card against 313×930 px for the imposter card at 200% text on a 360 px phone). Accepted for now. Fixing it would mean taller cards for everyone at large sizes, or putting the real word, hidden, on the imposter's phone.
- **Hold to reveal:** the card itself is the control (no separate button): it shows only while the card is held. Releasing it hides the card. In tap mode one tap on the card shows it and another hides it.
- **Hint mode setting:** "Μόνο κατηγορία", "Κατηγορία + στοιχείο" (the default) or "Μόνο στοιχείο". In hint-only mode the category is not shown anywhere during the round (the clue-round bar hides it too).
- **Number of imposters:** a stepper, default 1.
- **Timer:** an on/off switch plus a duration (default 3:00). When it's off, hide the duration in settings and the countdown ring on the clue-round screen.
- **Turn order:** each round picks a random starting player. They see their card first and the others follow in the order the players were entered; with «Κρυφή ψηφοφορία» on, the clue round starts from the same player; with it off, the «Ψηφίστε φωναχτά» screen shows «Ξεκινά: <name>» and the full order.
- **Voting:** a «Κρυφή ψηφοφορία» switch in round settings, off by default.
  - Off: after the last card, one screen. «Αποκάλυψε τον Imposter» shows the name, then «Τον πιάσατε;». Either way the imposter then guesses out loud, the word is shown, then «Το βρήκε» / «Δεν το βρήκε». Caught: they win only if the guess is right. Not caught: they win either way. The clue round and timer are skipped (the group plays out loud).
  - On: the clue-round screen (with the optional timer), then a secret vote, one player at a time on the same phone, then the result screen. The result names the imposter but keeps the word hidden until they have guessed out loud, caught or not. Caught: they win only if the guess is right. Not caught: they win either way, and the guess is for the glory.
- **Result:** reveal the imposter, the word, the hint they had and the vote tally. Then offer "the imposter guesses" and "new round".

## Screens

1. **Αρχική:** logo, "Νέο παιχνίδι" and "Πώς παίζεται".
2. **Παίκτες:** add or remove names (saved for next time) and the imposter-count stepper.
3. **Ρυθμίσεις γύρου:** category chips, hint mode, timer switch and duration, then "Μοίρασε ρόλους".
4. **Πέρασε το κινητό:** "Δώσε το κινητό στην <name>", progress dots and an "Είμαι η/ο <name>" button. This screen looks the same for everyone.
5. **Η λέξη σου:** the normal player's card.
6. **Imposter card:** visually identical to screen 5.
7. **Γύρος στοιχείων:** whose turn it is, the clues given so far, and the optional countdown.
8. **Ψηφοφορία:** a grid of players to vote on.
9. **Αποτέλεσμα:** verdict, word and hint, vote tally, the imposter's guess and "new round".

The settings screen lists every category in `words-el.json`, using each category's `name` and `icon`.

## Word data

```json
{
  "version": 4,
  "language": "el",
  "categories": [
    { "id": "food", "name": "Φαγητά", "icon": "🍕",
      "words": [ { "word": "μουσακάς", "hint": "φούρνος" } ] }
  ]
}
```

Categories: Φαγητά, Ζώα, Μέρη στην Ελλάδα, Επαγγέλματα, Αντικείμενα σπιτιού, Αθλήματα, Καλοκαίρι & θάλασσα, Μουσικά όργανα, Γιορτές & εκδηλώσεις, Διάσημοι, Υπερήρωες, Σειρές & εκπομπές.

Foreign names (Taylor Swift, Batman, Friends) are in Latin letters, and Greek names are in Greek.

### Writing hints

Only the imposter sees the hint, together with the category. A good hint lets them give a believable clue without being able to work out the word. Golden rule: obvious to insiders, ambiguous to outsiders.

- One word, one step removed from the secret word: an association, situation, feeling or less obvious connection. No descriptions, synonyms or direct clues.
- Judge it with the category: "ελιές" alone is vague, but under Μέρη στην Ελλάδα it means Καλαμάτα.
- Not too specific: if anyone in Greece would link the two straight away (Ζάκυνθος → ναυάγιο, Κρήτη → μπαλωθιές), it's too obvious.
- Not too vague: the hint must still mean something to someone who knows the word (Ακρόπολη → σκαλωσιές was too vague; μάρμαρο works).
- Where possible, give two words in a category the same angle, so the imposter can't tell which it is (Ακρόπολη and Πάρος → μάρμαρο).
- Never repeat the word or part of it (κολοκυθοκεφτέδες → κολοκύθι is wrong).
- Never use a hint that is also a word in the game.

### Picking words without repeats

Build a pool from the selected categories. Store the used words in `localStorage`, and pick at random from the words not used yet. When every word in the selected categories has been used, reset the used words for those categories only.

```js
import data from "./words-el.json";

export function nextWord(selectedIds) {
  const pool = data.categories
    .filter(c => selectedIds.includes(c.id))
    .flatMap(c => c.words.map(w => ({ ...w, category: c.name })));
  let used = [];
  try { used = JSON.parse(localStorage.getItem("usedWords")) || []; } catch {}
  let left = pool.filter(p => !used.includes(p.word));
  if (left.length === 0) {
    const inPool = new Set(pool.map(p => p.word));
    used = used.filter(w => !inPool.has(w));
    left = pool;
  }
  const pick = left[Math.floor(Math.random() * left.length)];
  try { localStorage.setItem("usedWords", JSON.stringify([...used, pick.word])); } catch {}
  return pick; // { word, hint, category }
}
```

## Stack (decided)

- Vite + React. Use `vite-plugin-pwa` for the manifest and service worker, so the app installs to the home screen and works offline.
- No UI framework or component library. Plain CSS, with all colours and effects as tokens in `src/styles/global.css`.
- **Theme:** "windows at night". A dark facade with carved window casings; on Home, a detailed night building with a few lit windows (each with a small scene), globe street lamps in fog and onlookers seen from behind, with the title set like a film credit (a small red line over large gold Didot capitals, on a dark backing). The secret card is a warm orange wall with branch shadows inside a carved window surround; votes are lit windows and your pick glows red. Design mockups and reference images are kept outside the repo (`design/` is in `.gitignore`); some reference images are third-party frames and must never be committed.
- **Fonts:** GFS Didot 400 (widely spaced capitals for titles, the secret word) and Alegreya Sans 400/400 italic/700/800 (text and labels), self-hosted from `@fontsource` (Greek + Latin woff2 only). Any replacement font must have readable Greek: check the glyphs, not just that Greek exists (Advent Pro was dropped because its Ι, Ο, Φ and Υ look like 1, 0, Ψ and Ч).
- **Card text and shadows:** the branch shadows on the card are kept light where text can fall, so the ink stays at 4.5:1 or more on the shadiest spot (#c4602a). Long words shrink to fit one line: `.card .word` and `.big-name` size from the longest word (`fitStyle` in `src/lib/format.js`).
- Hosting: free static hosting on Netlify, Vercel, Cloudflare Pages or GitHub Pages. PWAs need HTTPS, and all of these provide it.

## Accessibility (required)

Target WCAG 2.2 AA on every screen.

- **Semantics:** set `<html lang="el">`. Use real `<button>` elements, not clickable divs. Give each screen one `<h1>`, and use proper labels on inputs, the switch (`role="switch"` + `aria-checked`) and the steppers.
- **Focus:** when the screen changes, move focus to the new screen's heading. Every control needs a clearly visible focus style. Never trap focus.
- **Keyboard:** everything works without a mouse or touch. Hold-to-reveal must also work by holding Space or Enter.
- **Hold-to-reveal alternative:** some players can't press and hold. Add a setting, "Πάτα για εμφάνιση / απόκρυψη", where one tap shows the card and another tap hides it.
- **Screen readers:** the secret word must never be announced on its own (no `aria-live` on the card). It's read only when the player focuses it, so a screen-reader user with headphones keeps it private. "Πώς παίζεται" can suggest using headphones.
- **Contrast:** at least 4.5:1 for text and 3:1 for UI parts and focus rings. This applies to every colour pair, including the yellow buttons and muted grey text.
- **Not colour alone:** state is always shown with text or a shape too. For example, the vote pick shows "Η ψήφος σου", and the timer switch shows its on/off position.
- **Touch targets:** at least 44×44 px, with spacing between targets.
- **Text size:** use `rem` units. The layout must survive 200% browser zoom and large OS text settings without clipping or overlapping.
- **Motion:** respect `prefers-reduced-motion`. Card tilt and transitions go flat or instant when it's set.
- **Timer:** announce only at key moments (1 minute left, 10 seconds left, time's up), not every second. Allow pause.
- **Test:** run axe (`@axe-core/react` in dev, or the browser extension) and check VoiceOver/TalkBack on at least the reveal and vote screens.

## Responsiveness (required)

- **Mobile first:** design for 360 px wide, and make sure it works down to 320 px.
- **Sizes to check:** small phone (320×568), normal phone (390×844), large phone, tablet, and desktop. On wide screens, centre the app in a phone-width column (about 480 px max) rather than stretching it.
- **Landscape:** no screen may break or hide its main button. Screens scroll if needed.
- **Layout:** use `100dvh` (not `100vh`) and respect safe areas (`env(safe-area-inset-*)`) for notches and home bars.
- **Long content:** long names ("Γιάννης Αντετοκούνμπο", "Κωνσταντίνου και Ελένης") must wrap or scale, never overflow. Test with the longest words in the list and long player names.
- **No hover-only interactions.** During a round, keep the screen awake with the Wake Lock API when it's available, and ignore it when it isn't.

## Performance (required)

The app should open instantly on a mid-range phone on mobile data, and be fully usable offline after the first visit.

- **Budgets:** under about 100 KB of JS gzipped for the first load. Lighthouse mobile scores ≥ 90 for Performance, Accessibility, Best Practices and SEO. LCP under 2.5 s on a mid-range phone over 4G, and CLS close to 0.
- **Dependencies:** keep them minimal. No UI kits, icon packs, animation libraries or state libraries. React state or `useReducer` is enough.
- **Fonts:** self-host them with `@fontsource` (Greek + Latin subsets only, woff2, only the weights actually used) so they're precached and work offline. Use `font-display: swap` with a system-font fallback and preload the main face.
- **Assets:** use SVG or inline icons, and keep PWA icons optimised. Emoji category icons cost nothing.
- **Word list:** the JSON is about 46 KB, so import it directly. It ends up in the bundle and the service worker precaches it.
- **Service worker:** precache the whole app (`vite-plugin-pwa` with `registerType: "autoUpdate"`), so later visits load from cache with no network at all.
- **Check:** run `npm run build`, look at the bundle size, and run Lighthouse on the production build.

## Out of scope for now

- Custom words and categories ("Οι λέξεις μου"). This was dropped for now.
- Decoy / undercover mode, where the imposter gets a similar word.
- Online multiplayer with room codes. That would need Firebase or Supabase.

## Suggested first steps

1. Scaffold the Vite + React app and copy `data/words-el.json` into `src/data/`.
2. Build the game state as a small state machine: setup → reveal (per player) → clues → vote → result.
3. Build the screens in the order listed under "Screens".
4. Check each screen for accessibility and responsiveness as it's built, not at the end.
5. Add the PWA manifest and icons, run Lighthouse and axe on the production build, then test on a real phone.

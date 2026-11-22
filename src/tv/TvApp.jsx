import { useEffect, useReducer, useState } from "react";
import { load, save } from "../lib/storage.js";
import { useWakeLock } from "../lib/useWakeLock.js";
import { initState, maxImposters, reducer } from "../game/state.js";
import { Players } from "../screens/Players.jsx";
import { Settings } from "../screens/Settings.jsx";
import { decodeGame, encodeGame, gameRound, isDeckPlace, randomDeckPlace } from "./code.js";
import { TvCards, TvClues, TvHome, TvHowTo, TvLobby } from "./TvScreens.jsx";
import { TvUnmask } from "./TvUnmask.jsx";
import { enableSpatialNav } from "./spatialNav.js";
import "./tv.css";

const ROUND_SCREENS = new Set(["lobby", "cards", "clues", "unmask"]);

// The big-screen version, opened at /#tv. The TV holds the players, settings and used words,
// deals each round and shows its code; the phones only show their own card (Join.jsx).
// Flow: home → players → settings → lobby (code + QR, once per game) → cards → clues (timer on) → unmask
//   → next round: straight to cards; the phones tap «Επόμενος γύρος» and work out the same round.
// A game lasts until the players, categories, hint mode or imposter count change.
export default function TvApp() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const { screen, players, settings } = state;
  const [game, setGame] = useState(null); // { code, key, names, decoded }
  const [round, setRound] = useState(null);
  const code = game?.code ?? "";
  const go = (screen) => dispatch({ type: "go", screen });

  useEffect(() => save("players", players), [players]);
  useEffect(() => save("settings", settings), [settings]);
  useEffect(() => enableSpatialNav(), []);
  useWakeLock(ROUND_SCREENS.has(screen));

  // Deals round r of a game and moves the TV's place in the word deck past its word,
  // so the next game (even another evening) goes on with new words.
  function play(g, r) {
    const next = gameRound(g.decoded, r);
    setRound(next);
    save("tvDeck", next.after);
  }

  // From the settings: the same game goes on if nothing that is in the code changed.
  // `fresh`: «Νέο παιχνίδι» at the end of a round, a new code even with the same settings.
  function deal(fresh = false) {
    const params = {
      categories: settings.categories,
      hintMode: settings.hintMode,
      players: players.length,
      imposters: Math.min(Math.max(1, settings.imposters), maxImposters(players.length)),
    };
    const key = JSON.stringify(params);
    if (!fresh && game && round && game.key === key && game.names === players.join("\n")) {
      play(game, round.number + 1);
      go("cards");
      return;
    }
    const saved = load("tvDeck", null);
    const newCode = encodeGame({ ...params, start: isDeckPlace(saved) ? saved : randomDeckPlace() });
    const g = { code: newCode, key, names: players.join("\n"), decoded: decodeGame(newCode).game };
    setGame(g);
    play(g, 1);
    go("lobby");
  }

  function nextRound() {
    play(game, round.number + 1);
    go("cards");
  }

  const view = render();
  // During a round, a small «Γύρος N» in the top-right corner of every screen, so the room can check
  // it against the «Γύρος N» on the phones.
  return ROUND_SCREENS.has(screen) && round ? (
    <>
      {view}
      <aside className="tv-round-badge" aria-label="Γύρος">Γύρος <b>{round.number}</b></aside>
    </>
  ) : view;

  function render() {
    switch (screen) {
      case "home":
        return <TvHome onNewGame={() => go("players")} onHowTo={() => go("howto")} />;
      case "howto":
        return <TvHowTo onBack={() => go("home")} onNewGame={() => go("players")} />;
      case "players":
        return (
          <div className="tv-column">
            <Players tv players={players} imposters={settings.imposters} dispatch={dispatch} onBack={() => go("home")} onNext={() => go("settings")} />
          </div>
        );
      case "settings":
        return (
          <div className="tv-column">
            <Settings tv settings={settings} dispatch={dispatch} onBack={() => go("players")} onDeal={() => deal()} />
          </div>
        );
      case "lobby":
        return <TvLobby key={code} players={players} round={round} code={code} onReady={() => go("cards")} onSettings={() => go("settings")} />;
      case "cards":
        return <TvCards key={`${code}-${round.number}`} players={players} round={round} settings={settings} code={code} onGo={() => go(settings.timerOn ? "clues" : "unmask")} />;
      case "clues":
        return <TvClues key={`${code}-${round.number}`} players={players} round={round} settings={settings} code={code} onVote={() => go("unmask")} />;
      case "unmask":
        return (
          <TvUnmask
            key={`${code}-${round.number}`}
            players={players}
            round={round}
            code={code}
            hintMode={settings.hintMode}
            onNewRound={nextRound}
          onNewGame={() => deal(true)}
            onPlayers={() => go("players")}
          />
        );
      default:
        return null;
    }
  }
}

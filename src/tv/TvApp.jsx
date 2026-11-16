import { useEffect, useReducer, useState } from "react";
import { save } from "../lib/storage.js";
import { useWakeLock } from "../lib/useWakeLock.js";
import { createRound, initState, reducer } from "../game/state.js";
import { Players } from "../screens/Players.jsx";
import { Settings } from "../screens/Settings.jsx";
import { encodeRound, wordIndex } from "./code.js";
import { TvCards, TvClues, TvHome, TvHowTo, TvLobby } from "./TvScreens.jsx";
import { TvUnmask } from "./TvUnmask.jsx";
import { enableSpatialNav } from "./spatialNav.js";
import "./tv.css";

const ROUND_SCREENS = new Set(["lobby", "cards", "clues", "unmask"]);

// The big-screen version, opened at /#tv. The TV holds the players, settings and used words,
// deals each round and shows its code; the phones only show their own card (Join.jsx).
// Flow: home → players → settings → lobby (code + QR) → cards → clues (timer on) → unmask → new round
export default function TvApp() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const { screen, players, settings } = state;
  const [round, setRound] = useState(null);
  const [code, setCode] = useState("");
  const go = (screen) => dispatch({ type: "go", screen });

  useEffect(() => save("players", players), [players]);
  useEffect(() => save("settings", settings), [settings]);
  useEffect(() => enableSpatialNav(), []);
  useWakeLock(ROUND_SCREENS.has(screen));

  function deal(number = 1) {
    const r = createRound(players, settings, number);
    setRound(r);
    setCode(encodeRound({ wordIndex: wordIndex(r), hintMode: settings.hintMode, players: players.length, imposters: r.imposters }));
    go("lobby");
  }

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
          <Settings tv settings={settings} dispatch={dispatch} onBack={() => go("players")} onDeal={() => deal(round ? round.number + 1 : 1)} />
        </div>
      );
    case "lobby":
      return <TvLobby key={code} players={players} round={round} code={code} onReady={() => go("cards")} onSettings={() => go("settings")} />;
    case "cards":
      return <TvCards players={players} round={round} settings={settings} onGo={() => go(settings.timerOn ? "clues" : "unmask")} />;
    case "clues":
      return <TvClues key={code} players={players} round={round} settings={settings} onVote={() => go("unmask")} />;
    case "unmask":
      return (
        <TvUnmask
          key={code}
          players={players}
          round={round}
          hintMode={settings.hintMode}
          onNewRound={() => deal(round.number + 1)}
          onPlayers={() => go("players")}
        />
      );
    default:
      return null;
  }
}

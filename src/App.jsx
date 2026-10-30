import { useEffect, useReducer } from "react";
import { save } from "./lib/storage.js";
import { useWakeLock } from "./lib/useWakeLock.js";
import { createRound, initState, reducer } from "./game/state.js";
import { Home } from "./screens/Home.jsx";
import { Players } from "./screens/Players.jsx";
import { Settings } from "./screens/Settings.jsx";
import { HowTo } from "./screens/HowTo.jsx";
import { Pass } from "./screens/Pass.jsx";
import { Reveal } from "./screens/Reveal.jsx";
import { Clues } from "./screens/Clues.jsx";
import { Vote } from "./screens/Vote.jsx";
import { Result } from "./screens/Result.jsx";
import { Unmask } from "./screens/Unmask.jsx";

const ROUND_SCREENS = new Set(["pass", "reveal", "clues", "votePass", "vote", "result", "unmask"]);

const REVEAL_NOTE = {
  hold: "Η λέξη εμφανίζεται μόνο όσο κρατάς πατημένο το κουμπί.",
  tap: "Η λέξη εμφανίζεται όταν πατήσεις το κουμπί και κρύβεται με δεύτερο πάτημα.",
};

// Flow: home → players → settings → (pass → reveal) per player, then
//   secret vote on:  clues → (votePass → vote) per player → result
//   secret vote off: unmask (the group talks and votes out loud)
export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const { screen, players, settings, round } = state;
  const go = (screen) => dispatch({ type: "go", screen });
  const deal = (number = 1) => dispatch({ type: "deal", round: createRound(players, settings, number) });

  useEffect(() => save("players", players), [players]);
  useEffect(() => save("settings", settings), [settings]);
  useWakeLock(ROUND_SCREENS.has(screen));

  switch (screen) {
    case "home":
      return <Home onNewGame={() => go("players")} onHowTo={() => go("howto")} />;
    case "howto":
      return <HowTo onBack={() => go("home")} onNewGame={() => go("players")} />;
    case "players":
      return (
        <Players
          players={players}
          imposters={settings.imposters}
          dispatch={dispatch}
          onBack={() => go("home")}
          onNext={() => go("settings")}
        />
      );
    case "settings":
      return <Settings settings={settings} dispatch={dispatch} onBack={() => go("players")} onDeal={() => deal()} />;
    case "pass":
      return (
        <Pass
          key={`pass-${round.number}-${round.revealIndex}`}
          name={players[round.revealIndex]}
          index={round.revealIndex}
          total={players.length}
          note={REVEAL_NOTE[settings.revealMode]}
          onReady={() => dispatch({ type: "showCard" })}
        />
      );
    case "reveal":
      return (
        <Reveal
          key={`reveal-${round.number}-${round.revealIndex}`}
          round={round}
          index={round.revealIndex}
          total={players.length}
          isImposter={round.imposters.includes(round.revealIndex)}
          hintMode={settings.hintMode}
          revealMode={settings.revealMode}
          onNext={() => dispatch({ type: "nextPlayer" })}
        />
      );
    case "clues":
      return (
        <Clues
          key={`clues-${round.number}`}
          players={players}
          round={round}
          settings={settings}
          dispatch={dispatch}
          onVote={() => dispatch({ type: "startVote" })}
        />
      );
    case "votePass":
      return (
        <Pass
          key={`vote-pass-${round.number}-${round.votes.length}`}
          name={players[round.votes.length]}
          index={round.votes.length}
          total={players.length}
          note="Σειρά σου να ψηφίσεις. Κανείς δεν θα δει τι ψήφισες."
          onReady={() => dispatch({ type: "readyToVote" })}
        />
      );
    case "vote":
      return (
        <Vote
          key={`vote-${round.number}-${round.votes.length}`}
          players={players}
          voter={round.votes.length}
          voted={round.votes.length}
          onVote={(target) => dispatch({ type: "castVote", target })}
        />
      );
    case "unmask":
      return (
        <Unmask
          key={`unmask-${round.number}`}
          players={players}
          round={round}
          hintMode={settings.hintMode}
          onNewRound={() => deal(round.number + 1)}
          onPlayers={() => go("players")}
        />
      );
    case "result":
      return (
        <Result
          key={`result-${round.number}`}
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

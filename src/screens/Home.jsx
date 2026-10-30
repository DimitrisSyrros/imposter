import { Screen } from "../components/Screen.jsx";
import { Logo } from "../components/Logo.jsx";

export function Home({ onNewGame, onHowTo }) {
  return (
    <Screen
      title="Ο Imposter"
      titleClassName="h home-title"
      before={<div className="logo"><Logo /></div>}
    >
      <p className="home-tagline">Όλοι ξέρουν τη λέξη. Εκτός από έναν.</p>
      <div className="grow facade" aria-hidden="true" />
      <div className="stack">
        <button type="button" className="btn" onClick={onNewGame}>Νέο παιχνίδι</button>
        <button type="button" className="btn ghost" onClick={onHowTo}>Πώς παίζεται</button>
      </div>
    </Screen>
  );
}

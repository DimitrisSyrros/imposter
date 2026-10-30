// The word and what the imposter saw. The word can stay hidden until the imposter has guessed.
export function RoundFacts({ round, hintMode, wordShown }) {
  const many = round.imposters.length > 1;
  return (
    <div className="reveal">
      <div>
        <span className="label">Η λέξη</span>
        {wordShown ? (
          <b>{round.word}</b>
        ) : (
          <b><span aria-hidden="true">• • •</span><span className="visually-hidden">κρυφή μέχρι την πρόβλεψη</span></b>
        )}
      </div>
      <div>
        <span className="label">{hintMode !== "category" ? (many ? "Το στοιχείο τους" : "Το στοιχείο του") : "Η κατηγορία"}</span>
        <b>{hintMode !== "category" ? round.hint : round.category}</b>
      </div>
    </div>
  );
}

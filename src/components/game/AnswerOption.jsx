export default function AnswerOption({
  option,
  index,
  selected,
  submitted,
  correct,
  actualAnswer,
  onSelect,
}) {
  let stateClass = ''

  if (submitted && correct) {
    stateClass = 'is-correct'
  } else if (submitted && selected && !actualAnswer) {
    stateClass = 'is-wrong'
  } else if (selected) {
    stateClass = 'is-selected'
  }

  return (
    <button
      aria-checked={selected}
      className={`answer-option ${stateClass}`.trim()}
      disabled={submitted}
      onClick={() => onSelect(option)}
      role="radio"
      type="button"
    >
      <span className="answer-key" aria-hidden="true">
        {String.fromCharCode(65 + index)}
      </span>
      <span>{option}</span>
      {submitted && correct && <span className="answer-state">Correct</span>}
      {submitted && selected && !actualAnswer && (
        <span className="answer-state">Incorrect</span>
      )}
    </button>
  )
}

import AnswerOption from './AnswerOption.jsx'

function resolveCorrectAnswer(question) {
  if (typeof question.correctAnswer === 'number') {
    return question.options[question.correctAnswer]
  }

  return question.correctAnswer
}

export default function QuestionCard({
  question,
  selectedAnswer,
  submitted,
  onSelect,
  onSubmit,
  onNext,
  nextLabel = 'NEXT QUESTION',
  marked,
  onToggleMarked,
  autoShowExplanation = true,
}) {
  const correctAnswer = resolveCorrectAnswer(question)
  const isCorrect = submitted && selectedAnswer === correctAnswer

  return (
    <article className={`question-card game-card ${submitted ? (isCorrect ? 'is-correct' : 'is-wrong') : ''}`}>
      <header className="question-card-header">
        <div className="cluster">
          <span className="badge badge-primary">{question.type}</span>
          <span className="badge badge-muted">{question.difficulty}</span>
          <span className="question-topic">{question.topic}</span>
        </div>
        <button
          aria-pressed={marked}
          className={`mark-question ${marked ? 'is-marked' : ''}`}
          onClick={() => onToggleMarked?.(question.id)}
          type="button"
        >
          {marked ? '★ Marked' : '☆ Mark for revision'}
        </button>
      </header>

      <h2>{question.question}</h2>
      {question.code && <pre className="question-code"><code>{question.code}</code></pre>}

      <div className="answer-list" role="radiogroup" aria-label="Answer options">
        {question.options.map((option, index) => (
          <AnswerOption
            actualAnswer={option === correctAnswer}
            correct={submitted && option === correctAnswer}
            index={index}
            key={`${question.id}-${option}`}
            onSelect={onSelect}
            option={option}
            selected={selectedAnswer === option}
            submitted={submitted}
          />
        ))}
      </div>

      <div aria-live="polite" className="question-feedback">
        {submitted && (
          <div className={`feedback-panel ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
            <strong>{isCorrect ? 'Correct — clean execution.' : `Not quite. The answer is ${correctAnswer}.`}</strong>
            {autoShowExplanation && <p>{question.explanation}</p>}
            {!autoShowExplanation && (
              <details className="feedback-explanation">
                <summary>View explanation</summary>
                <p>{question.explanation}</p>
              </details>
            )}
          </div>
        )}
      </div>

      {!submitted && question.hint && (
        <details className="question-hint">
          <summary>Need a hint?</summary>
          <p>{question.hint}</p>
        </details>
      )}

      <footer className="question-actions">
        {!submitted ? (
          <button
            className="btn btn-primary"
            disabled={selectedAnswer == null}
            onClick={onSubmit}
            type="button"
          >
            SUBMIT ANSWER
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onNext} type="button">
            {nextLabel}
          </button>
        )}
      </footer>
    </article>
  )
}

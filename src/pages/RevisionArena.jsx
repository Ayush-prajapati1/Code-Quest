import { useMemo, useState } from 'react'
import MissionProgress from '../components/game/MissionProgress.jsx'
import QuestionCard from '../components/game/QuestionCard.jsx'
import { useGame } from '../context/GameContext.jsx'
import { allQuestions } from '../data/questions/index.js'
import { technologies } from '../data/technologies.js'
import { isAnswerCorrect } from '../utils/questions.js'

export default function RevisionArena() {
  const { player, recordAnswer, toggleMarkedQuestion } = useGame()
  const [technology, setTechnology] = useState('all')
  const [topic, setTopic] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [source, setSource] = useState('all')
  const [playing, setPlaying] = useState(false)
  const [index, setIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const markedIds = player.revision.markedQuestions
  const incorrectIds = player.revision.incorrectQuestions
  const revisionIds = useMemo(
    () => new Set([...markedIds, ...incorrectIds]),
    [incorrectIds, markedIds],
  )
  const revisionQuestions = useMemo(
    () => allQuestions.filter((question) => revisionIds.has(question.id)),
    [revisionIds],
  )
  const topics = useMemo(
    () => [...new Set(revisionQuestions
      .filter((question) => technology === 'all' || question.technology === technology)
      .map((question) => question.topic))].sort(),
    [revisionQuestions, technology],
  )
  const filteredQuestions = useMemo(
    () => revisionQuestions.filter((question) => {
      const sourceMatch = source === 'all'
        || (source === 'marked' && markedIds.includes(question.id))
        || (source === 'incorrect' && incorrectIds.includes(question.id))
      return sourceMatch
        && (technology === 'all' || question.technology === technology)
        && (topic === 'all' || question.topic === topic)
        && (difficulty === 'all' || question.difficulty.toLowerCase() === difficulty)
    }),
    [difficulty, incorrectIds, markedIds, revisionQuestions, source, technology, topic],
  )

  const currentQuestion = filteredQuestions[index]

  const begin = () => {
    setIndex(0)
    setSelectedAnswer(null)
    setSubmitted(false)
    setPlaying(true)
  }

  const submit = () => {
    if (!currentQuestion || selectedAnswer == null || submitted) {
      return
    }

    const correct = isAnswerCorrect(currentQuestion, selectedAnswer)
    recordAnswer({
      question: currentQuestion,
      correct,
      technologyId: currentQuestion.technology,
      mode: 'revision',
    })
    setSubmitted(true)
  }

  const advance = () => {
    if (index >= filteredQuestions.length - 1) {
      setPlaying(false)
      setIndex(0)
      setSelectedAnswer(null)
      setSubmitted(false)
      return
    }

    setIndex((current) => current + 1)
    setSelectedAnswer(null)
    setSubmitted(false)
  }

  if (playing && currentQuestion) {
    return (
      <div className="page-container quiz-page">
        <header className="quiz-toolbar">
          <div><p className="page-eyebrow">REVISION ARENA</p><h1 className="quiz-title">KNOWLEDGE REMATCH</h1></div>
          <button className="btn btn-ghost" onClick={() => setPlaying(false)} type="button">EXIT PRACTICE</button>
        </header>
        <MissionProgress current={index} label="Revision progress" total={filteredQuestions.length} />
        <QuestionCard
          autoShowExplanation
          marked={markedIds.includes(currentQuestion.id)}
          nextLabel={index === filteredQuestions.length - 1 ? 'FINISH ROUND' : 'NEXT QUESTION'}
          onNext={advance}
          onSelect={setSelectedAnswer}
          onSubmit={submit}
          onToggleMarked={toggleMarkedQuestion}
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          submitted={submitted}
        />
      </div>
    )
  }

  return (
    <section className="page-container" aria-labelledby="revision-title">
      <header className="page-hero">
        <p className="page-eyebrow">TRAINING GROUNDS</p>
        <h1 className="page-title" id="revision-title">REVISION ARENA</h1>
        <p className="page-description">Replay marked questions and previous mistakes until the pattern becomes instinct.</p>
      </header>

      <section className="game-card filter-panel" aria-label="Revision filters">
        <label>Technology
          <select value={technology} onChange={(event) => { setTechnology(event.target.value); setTopic('all') }}>
            <option value="all">All technologies</option>
            {technologies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>Topic
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="all">All topics</option>
            {topics.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Difficulty
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="all">All difficulties</option>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
        </label>
        <label>Source
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="all">Marked + incorrect</option>
            <option value="incorrect">Incorrect only</option>
            <option value="marked">Marked only</option>
          </select>
        </label>
      </section>

      {revisionQuestions.length === 0 ? (
        <article className="game-card empty-state-card">
          <span className="placeholder-icon" aria-hidden="true">↻</span>
          <h2>Your revision queue is clear</h2>
          <p>Mark a question during any mission, or return after an incorrect answer.</p>
        </article>
      ) : filteredQuestions.length === 0 ? (
        <article className="game-card empty-state-card"><h2>No matches</h2><p>Adjust the filters to reveal another training set.</p></article>
      ) : (
        <section className="revision-summary">
          <div className="result-grid">
            <article><span>Available</span><strong>{filteredQuestions.length}</strong></article>
            <article><span>Marked</span><strong>{markedIds.length}</strong></article>
            <article><span>Incorrect history</span><strong>{incorrectIds.length}</strong></article>
          </div>
          <button className="btn btn-primary" onClick={begin} type="button">START REVISION ROUND</button>
          <div className="revision-question-list">
            {filteredQuestions.slice(0, 12).map((question) => (
              <article className="game-card revision-list-card" key={question.id}>
                <div className="cluster"><span className="badge badge-primary">{question.technology.toUpperCase()}</span><span className="badge badge-muted">{question.difficulty}</span></div>
                <h2>{question.question}</h2>
                <span>{question.topic}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  )
}

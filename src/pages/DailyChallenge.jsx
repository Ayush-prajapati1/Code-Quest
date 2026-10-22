import { useMemo, useState } from 'react'
import MissionProgress from '../components/game/MissionProgress.jsx'
import QuestionCard from '../components/game/QuestionCard.jsx'
import { useGame } from '../context/GameContext.jsx'
import { allQuestions } from '../data/questions/index.js'
import { createDailyChallenge } from '../utils/dailyChallenge.js'
import { getCorrectAnswer, isAnswerCorrect } from '../utils/questions.js'
import { getWeeklyStreak, toDateKey } from '../utils/streak.js'

export default function DailyChallenge() {
  const {
    completeDailyChallenge,
    player,
    recordAnswer,
    saveRunProgress,
    startRun,
    toggleMarkedQuestion,
  } = useGame()
  const [today] = useState(() => toDateKey(new Date()))
  const challenge = useMemo(
    () => createDailyChallenge({ date: today, questions: allQuestions }),
    [today],
  )
  const completedToday = player.dailyChallenge.date === today && player.dailyChallenge.completed
  const savedRun = player.session?.activeRun
  const canResume = Boolean(
    challenge &&
    savedRun?.mode === 'daily' &&
    savedRun?.missionId === challenge.id,
  )
  const [phase, setPhase] = useState(completedToday ? 'complete' : canResume ? 'playing' : 'intro')
  const resumeIndex = canResume
    ? Math.min(savedRun.currentIndex ?? 0, Math.max(0, challenge.questions.length - 1))
    : 0
  const restoredAnswer = canResume
    ? savedRun.answers?.find((answer) => answer.questionId === challenge.questions[resumeIndex]?.id)
    : null
  const [questionIndex, setQuestionIndex] = useState(resumeIndex)
  const [selectedAnswer, setSelectedAnswer] = useState(
    canResume ? savedRun.selectedAnswer ?? restoredAnswer?.selectedAnswer ?? null : null,
  )
  const [submitted, setSubmitted] = useState(
    canResume ? Boolean(savedRun.submitted || restoredAnswer) : false,
  )
  const [answers, setAnswers] = useState(canResume ? savedRun.answers ?? [] : [])
  const week = getWeeklyStreak(player.streak.activeDates, today)

  if (!challenge || challenge.questions.length === 0) {
    return (
      <section className="page-container error-state" aria-labelledby="daily-error-title">
        <span className="error-code">DAILY_ARCHIVE_OFFLINE</span>
        <h1 className="page-title" id="daily-error-title">Daily challenge unavailable</h1>
        <p className="page-description">The local question archive could not assemble today&apos;s quest.</p>
      </section>
    )
  }

  const currentQuestion = challenge.questions[questionIndex]

  const begin = () => {
    setQuestionIndex(0)
    setSelectedAnswer(null)
    setSubmitted(false)
    setAnswers([])
    startRun({
      missionId: challenge.id,
      mode: 'daily',
      questionIds: challenge.questionIds,
    })
    setPhase('playing')
  }

  const submit = () => {
    if (submitted || selectedAnswer == null) {
      return
    }

    const correct = isAnswerCorrect(currentQuestion, selectedAnswer)
    const nextAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        correct,
        selectedAnswer,
        correctAnswer: getCorrectAnswer(currentQuestion),
      },
    ]
    setAnswers(nextAnswers)
    setSubmitted(true)
    recordAnswer({
      question: currentQuestion,
      correct,
      technologyId: currentQuestion.technology,
      mode: 'daily',
    })
    saveRunProgress({
      currentIndex: questionIndex,
      answers: nextAnswers,
      selectedAnswer,
      submitted: true,
    })
  }

  const advance = () => {
    if (questionIndex >= challenge.questions.length - 1) {
      const correct = answers.filter((answer) => answer.correct).length
      completeDailyChallenge(challenge, {
        correct,
        total: answers.length,
      })
      setPhase('complete')
      return
    }

    const nextIndex = questionIndex + 1
    setQuestionIndex(nextIndex)
    setSelectedAnswer(null)
    setSubmitted(false)
    saveRunProgress({
      currentIndex: nextIndex,
      answers,
      selectedAnswer: null,
      submitted: false,
    })
  }

  if (phase === 'complete') {
    const score = answers.length
      ? answers.filter((answer) => answer.correct).length
      : player.dailyChallenge.score
    const total = answers.length || player.dailyChallenge.totalQuestions || challenge.questions.length

    return (
      <section className="page-container result-screen daily-complete" aria-labelledby="daily-complete-title">
        <div className="result-emblem" aria-hidden="true">◆</div>
        <p className="page-eyebrow">DAILY SIGNAL COMPLETE</p>
        <h1 className="page-title" id="daily-complete-title">CHALLENGE CLEARED</h1>
        <p className="page-description">Return tomorrow for a new deterministic mix of coding trials.</p>
        <div className="result-grid">
          <article><span>Score</span><strong>{score}/{total}</strong></article>
          <article><span>Daily XP</span><strong>+{challenge.reward.xp}</strong></article>
          <article><span>Daily coins</span><strong>+{challenge.reward.coins}</strong></article>
          <article><span>Current streak</span><strong>{player.streak.current} days</strong></article>
        </div>
        <div className="streak-week" aria-label="This week's activity">
          {week.map((day) => (
            <div className={`${day.active ? 'is-active' : ''} ${day.isToday ? 'is-today' : ''}`} key={day.date}>
              <span>{day.day}</span><strong aria-label={day.active ? 'Active' : 'Not active'}>{day.active ? '●' : '○'}</strong>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="page-container daily-page">
        <header className="page-hero">
          <p className="page-eyebrow">DAILY QUEST // {today}</p>
          <h1 className="page-title">DAILY CHALLENGE</h1>
          <p className="page-description">One seeded challenge each day. Your quest is identical after refresh and its completion reward can be claimed once.</p>
        </header>
        <section className="game-card daily-briefing">
          <div className="daily-token" aria-hidden="true">24H</div>
          <div>
            <span className="badge badge-warning">TODAY&apos;S MIX</span>
            <h2>{challenge.questions.length} focused questions</h2>
            <ul className="daily-task-list">
              <li>2 Data Structures & Algorithms</li>
              <li>1 SQL</li>
              <li>1 React</li>
            </ul>
            <p>Completion reward: <strong>+{challenge.reward.xp} XP · +{challenge.reward.coins} coins</strong></p>
            <button className="btn btn-primary" onClick={begin} type="button">START DAILY QUEST</button>
          </div>
        </section>
        <section className="game-card streak-panel" aria-labelledby="streak-title">
          <div className="section-heading-row">
            <div><p className="page-eyebrow">CONSISTENCY ENGINE</p><h2 id="streak-title">{player.streak.current} day streak</h2></div>
            <strong>Best: {player.streak.longest}</strong>
          </div>
          <div className="streak-week">
            {week.map((day) => (
              <div className={`${day.active ? 'is-active' : ''} ${day.isToday ? 'is-today' : ''}`} key={day.date}>
                <span>{day.day}</span><strong>{day.active ? '●' : '○'}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page-container quiz-page">
      <header className="quiz-toolbar">
        <div><p className="page-eyebrow">DAILY QUEST // {today}</p><h1 className="quiz-title">TODAY&apos;S CHALLENGE</h1></div>
        <div className="quiz-resource-bar"><span className="resource-pill">+{challenge.reward.xp} XP</span><span className="resource-pill">+{challenge.reward.coins} COINS</span></div>
      </header>
      <MissionProgress current={questionIndex} label="Daily challenge progress" total={challenge.questions.length} />
      <QuestionCard
        autoShowExplanation={player.settings.autoShowExplanation}
        marked={player.revision.markedQuestions.includes(currentQuestion.id)}
        nextLabel={questionIndex === challenge.questions.length - 1 ? 'COMPLETE DAILY QUEST' : 'NEXT QUESTION'}
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

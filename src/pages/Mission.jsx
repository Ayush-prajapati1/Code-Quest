import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProgressBar from '../components/common/ProgressBar.jsx'
import HeartDisplay from '../components/game/HeartDisplay.jsx'
import MissionProgress from '../components/game/MissionProgress.jsx'
import QuestionCard from '../components/game/QuestionCard.jsx'
import XPBar from '../components/game/XPBar.jsx'
import { useGame } from '../context/GameContext.jsx'
import { getMissionById, missions } from '../data/missions.js'
import { getQuestionsForTechnology } from '../data/questions/index.js'
import { technologies } from '../data/technologies.js'
import {
  getNextMission,
  getTechnologyMissions,
  isMissionCompleted,
  isMissionUnlocked,
} from '../utils/gameProgress.js'
import { getXPProgress } from '../utils/xp.js'
import {
  getCorrectAnswer,
  getQuestionsFromIds,
  isAnswerCorrect,
  selectMissionQuestions,
} from '../utils/questions.js'

function MissionError({ title, message, technologyId }) {
  return (
    <section className="page-container error-state" aria-labelledby="mission-error-title">
      <span className="error-code">MISSION_ABORTED</span>
      <h1 className="page-title" id="mission-error-title">{title}</h1>
      <p className="page-description">{message}</p>
      <Link className="btn btn-primary" to={technologyId ? `/technology/${technologyId}` : '/technologies'}>
        RETURN TO WORLD
      </Link>
    </section>
  )
}

export default function Mission() {
  const { technologyId, missionId } = useParams()
  const {
    clearRun,
    completeMission,
    player,
    recordAnswer,
    saveRunProgress,
    startRun,
    toggleMarkedQuestion,
  } = useGame()
  const technology = technologies.find((item) => item.id === technologyId)
  const mission = getMissionById(technologyId, missionId)
    ?? getMissionById(technologyId, `${technologyId}-${missionId}`)
  const worldMissions = getTechnologyMissions(missions, technologyId)
  const savedRun = player.session?.activeRun
  const canResume = Boolean(
    mission &&
    savedRun?.mode === 'mission' &&
    savedRun?.technologyId === technologyId &&
    savedRun?.missionId === mission.id,
  )
  const questionBank = getQuestionsForTechnology(technologyId)
  const selectedQuestions = useMemo(() => {
    const restoredQuestions = canResume
      ? getQuestionsFromIds(questionBank, savedRun.questionIds)
      : []

    return restoredQuestions.length
      ? restoredQuestions
      : selectMissionQuestions(questionBank, mission)
  }, [canResume, mission, questionBank, savedRun])
  const [phase, setPhase] = useState(
    canResume ? (savedRun.status === 'failed' ? 'failed' : 'playing') : 'intro',
  )
  const resumeIndex = canResume
    ? Math.min(savedRun.currentIndex ?? 0, selectedQuestions.length - 1)
    : 0
  const restoredAnswer = canResume
    ? savedRun.answers?.find((answer) => answer.questionId === selectedQuestions[resumeIndex]?.id)
    : null
  const [questionIndex, setQuestionIndex] = useState(resumeIndex)
  const [selectedAnswer, setSelectedAnswer] = useState(
    canResume ? savedRun.selectedAnswer ?? restoredAnswer?.selectedAnswer ?? null : null,
  )
  const [submitted, setSubmitted] = useState(
    canResume ? Boolean(savedRun.submitted || restoredAnswer) : false,
  )
  const [answers, setAnswers] = useState(canResume ? savedRun.answers ?? [] : [])
  const [summary, setSummary] = useState(null)

  if (!technology) {
    return <MissionError title="Unknown technology" message="The requested technology world does not exist." />
  }

  if (!mission || mission.boss) {
    return (
      <MissionError
        message="This mission ID is not available in the selected world."
        technologyId={technologyId}
        title="Mission not found"
      />
    )
  }

  if (!isMissionUnlocked(player, worldMissions, mission.id)) {
    return (
      <MissionError
        message="Complete the previous mission before attempting this quest."
        technologyId={technologyId}
        title="Mission locked"
      />
    )
  }

  if (selectedQuestions.length === 0) {
    return (
      <MissionError
        message="Question data for this world is unavailable. Choose another world while the archive repairs itself."
        technologyId={technologyId}
        title="Question archive offline"
      />
    )
  }

  const currentQuestion = selectedQuestions[questionIndex]
  const marked = currentQuestion
    ? player.revision.markedQuestions.includes(currentQuestion.id)
    : false
  const xpProgress = getXPProgress(player.totalXP)
  const alreadyCompleted = isMissionCompleted(player, technologyId, mission.id)

  const startMission = () => {
    setQuestionIndex(0)
    setAnswers([])
    setSelectedAnswer(null)
    setSubmitted(false)
    setSummary(null)
    startRun({
      technologyId,
      missionId: mission.id,
      mode: 'mission',
      questionIds: selectedQuestions.map((question) => question.id),
    })
    setPhase('playing')
  }

  const submitAnswer = () => {
    if (submitted || selectedAnswer == null) {
      return
    }

    const correct = isAnswerCorrect(currentQuestion, selectedAnswer)
    const nextAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        selectedAnswer,
        correctAnswer: getCorrectAnswer(currentQuestion),
        correct,
      },
    ]
    setAnswers(nextAnswers)
    setSubmitted(true)
    recordAnswer({ question: currentQuestion, correct, technologyId, mode: 'mission' })
    saveRunProgress({
      currentIndex: questionIndex,
      answers: nextAnswers,
      selectedAnswer,
      submitted: true,
    })
  }

  const advance = () => {
    const lastAnswer = answers.at(-1)

    if (!lastAnswer?.correct && player.hearts <= 0) {
      saveRunProgress({ status: 'failed', currentIndex: questionIndex, answers })
      setPhase('failed')
      return
    }

    if (questionIndex >= selectedQuestions.length - 1) {
      const correct = answers.filter((answer) => answer.correct).length
      const wrong = answers.length - correct
      const questionXP = selectedQuestions.reduce(
        (total, question) => total + (answers.find((answer) => answer.questionId === question.id)?.correct ? question.xp : 0),
        0,
      )
      const questionCoins = selectedQuestions.reduce(
        (total, question) => total + (answers.find((answer) => answer.questionId === question.id)?.correct ? question.coins : 0),
        0,
      )
      const result = {
        correct,
        wrong,
        total: answers.length,
        accuracy: answers.length ? Math.round((correct / answers.length) * 100) : 0,
        earnedXP: questionXP + (alreadyCompleted ? 0 : mission.rewardXP),
        earnedCoins: questionCoins + (alreadyCompleted ? 0 : mission.rewardCoins),
      }
      setSummary(result)
      completeMission(mission, result)
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

  if (phase === 'intro') {
    return (
      <div className="page-container mission-intro-page">
        <Link className="back-link" to={`/technology/${technologyId}`}>← BACK TO {technology.name.toUpperCase()} WORLD</Link>
        <section className="game-card mission-briefing" aria-labelledby="mission-title">
          <div className="mission-briefing-index" aria-hidden="true">
            {String(mission.order).padStart(2, '0')}
          </div>
          <div>
            <p className="page-eyebrow">MISSION BRIEFING // {technology.name}</p>
            <h1 className="page-title" id="mission-title">{mission.name}</h1>
            <p className="mission-story">{mission.story}</p>
            <dl className="mission-brief-grid">
              <div><dt>Topic</dt><dd>{mission.topic}</dd></div>
              <div><dt>Difficulty</dt><dd>{mission.difficulty}</dd></div>
              <div><dt>Questions</dt><dd>{selectedQuestions.length}</dd></div>
              <div><dt>Base reward</dt><dd>+{mission.rewardXP} XP · +{mission.rewardCoins} coins</dd></div>
            </dl>
            {alreadyCompleted && <p className="inline-notice">Replay mode: the one-time mission bonus has already been claimed.</p>}
            <div className="page-actions">
              <button className="btn btn-primary" onClick={startMission} type="button">
                {alreadyCompleted ? 'REPLAY MISSION' : 'START MISSION'}
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (phase === 'failed') {
    return (
      <section className="page-container result-screen result-failed" aria-labelledby="failed-title">
        <div className="result-emblem" aria-hidden="true">×</div>
        <p className="page-eyebrow">SYSTEM FAILURE</p>
        <h1 className="page-title" id="failed-title">MISSION FAILED</h1>
        <p className="page-description">Your hearts reached zero. Recompile your strategy and try again.</p>
        <div className="result-stats">
          <span><strong>{answers.filter((answer) => answer.correct).length}</strong> correct</span>
          <span><strong>{answers.filter((answer) => !answer.correct).length}</strong> incorrect</span>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={startMission} type="button">RETRY MISSION</button>
          <Link className="btn btn-secondary" onClick={clearRun} to={`/technology/${technologyId}`}>RETURN TO WORLD</Link>
        </div>
      </section>
    )
  }

  if (phase === 'complete') {
    const nextMission = getNextMission(worldMissions, mission.id)

    return (
      <section className="page-container result-screen result-complete" aria-labelledby="complete-title">
        <div className="result-emblem" aria-hidden="true">✓</div>
        <p className="page-eyebrow">QUEST COMPLETE</p>
        <h1 className="page-title" id="complete-title">MISSION COMPLETE</h1>
        <p className="page-description">{mission.name} has been secured. Your next route is unlocked.</p>
        <div className="result-grid">
          <article><span>Accuracy</span><strong>{summary?.accuracy ?? 0}%</strong></article>
          <article><span>Correct</span><strong>{summary?.correct ?? 0}</strong></article>
          <article><span>Wrong</span><strong>{summary?.wrong ?? 0}</strong></article>
          <article><span>XP earned</span><strong>+{summary?.earnedXP ?? 0}</strong></article>
          <article><span>Coins earned</span><strong>+{summary?.earnedCoins ?? 0}</strong></article>
        </div>
        <XPBar currentXP={xpProgress.currentLevelXP} level={xpProgress.level} requiredXP={xpProgress.requiredForNextLevel} />
        <div className="page-actions">
          {nextMission && (
            <Link className="btn btn-primary" to={`/mission/${technologyId}/${nextMission.id}`}>NEXT MISSION</Link>
          )}
          <Link className="btn btn-secondary" to={`/technology/${technologyId}`}>RETURN TO WORLD</Link>
          <button className="btn btn-ghost" onClick={() => setPhase('review')} type="button">REVIEW ANSWERS</button>
        </div>
      </section>
    )
  }

  if (phase === 'review') {
    return (
      <div className="page-container review-page">
        <header className="page-hero">
          <p className="page-eyebrow">MISSION RECORD</p>
          <h1 className="page-title">ANSWER REVIEW</h1>
          <button className="btn btn-secondary" onClick={() => setPhase('complete')} type="button">BACK TO RESULTS</button>
        </header>
        <div className="review-list">
          {answers.map((answer, index) => {
            const question = selectedQuestions.find((item) => item.id === answer.questionId)
            return (
              <article className={`game-card review-card ${answer.correct ? 'is-correct' : 'is-wrong'}`} key={answer.questionId}>
                <span className="badge badge-muted">Question {index + 1}</span>
                <h2>{question?.question}</h2>
                <p>Your answer: <strong>{answer.selectedAnswer}</strong></p>
                {!answer.correct && <p>Correct answer: <strong>{answer.correctAnswer}</strong></p>}
                <p>{question?.explanation}</p>
              </article>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container quiz-page">
      <header className="quiz-toolbar">
        <div>
          <p className="page-eyebrow">{technology.name} // {mission.name}</p>
          <h1 className="quiz-title">MISSION IN PROGRESS</h1>
        </div>
        <div className="quiz-resource-bar">
          <HeartDisplay hearts={player.hearts} maxHearts={player.maxHearts} />
          <span className="resource-pill">{player.totalXP} XP</span>
          <span className="resource-pill">{player.coins} COINS</span>
        </div>
      </header>
      <MissionProgress current={questionIndex} total={selectedQuestions.length} />
      <QuestionCard
        autoShowExplanation={player.settings.autoShowExplanation}
        marked={marked}
        nextLabel={questionIndex === selectedQuestions.length - 1 ? 'COMPLETE MISSION' : 'NEXT QUESTION'}
        onNext={advance}
        onSelect={setSelectedAnswer}
        onSubmit={submitAnswer}
        onToggleMarked={toggleMarkedQuestion}
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        submitted={submitted}
      />
      <ProgressBar compact label="Hearts remaining" max={player.maxHearts} value={player.hearts} variant="danger" />
    </div>
  )
}

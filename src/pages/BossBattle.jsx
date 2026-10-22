import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BossHealthBar from '../components/game/BossHealthBar.jsx'
import HeartDisplay from '../components/game/HeartDisplay.jsx'
import MissionProgress from '../components/game/MissionProgress.jsx'
import QuestionCard from '../components/game/QuestionCard.jsx'
import { useGame } from '../context/GameContext.jsx'
import { getBossMission, missions } from '../data/missions.js'
import { getQuestionsForTechnology } from '../data/questions/index.js'
import { technologies } from '../data/technologies.js'
import { getTechnologyMissions, isMissionCompleted } from '../utils/gameProgress.js'
import { getQuestionsFromIds, isAnswerCorrect, selectBossQuestions } from '../utils/questions.js'

function BattleMessage({ title, message, technologyId, action = 'RETURN TO WORLD' }) {
  return (
    <section className="page-container error-state" aria-labelledby="battle-message-title">
      <span className="error-code">BOSS_GATE</span>
      <h1 className="page-title" id="battle-message-title">{title}</h1>
      <p className="page-description">{message}</p>
      <Link className="btn btn-primary" to={technologyId ? `/technology/${technologyId}` : '/technologies'}>{action}</Link>
    </section>
  )
}

export default function BossBattle() {
  const { technologyId } = useParams()
  const {
    clearRun,
    defeatBoss,
    player,
    recordAnswer,
    saveRunProgress,
    startRun,
    toggleMarkedQuestion,
  } = useGame()
  const technology = technologies.find((item) => item.id === technologyId)
  const boss = getBossMission(technologyId)
  const worldMissions = getTechnologyMissions(missions, technologyId)
  const allMissionsComplete = worldMissions.length > 0 && worldMissions.every((mission) =>
    isMissionCompleted(player, technologyId, mission.id),
  )
  const savedRun = player.session?.activeRun
  const canResume = Boolean(
    boss &&
    savedRun?.mode === 'boss' &&
    savedRun?.technologyId === technologyId,
  )
  const questionBank = getQuestionsForTechnology(technologyId)
  const questions = useMemo(() => {
    const restoredQuestions = canResume
      ? getQuestionsFromIds(questionBank, savedRun.questionIds)
      : []

    return restoredQuestions.length
      ? restoredQuestions
      : selectBossQuestions(questionBank, boss)
  }, [boss, canResume, questionBank, savedRun])
  const [phase, setPhase] = useState(
    canResume ? (savedRun.status === 'failed' ? 'lost' : 'playing') : 'intro',
  )
  const [questionIndex, setQuestionIndex] = useState(
    canResume ? Math.min(savedRun.currentIndex ?? 0, Math.max(0, questions.length - 1)) : 0,
  )
  const [selectedAnswer, setSelectedAnswer] = useState(
    canResume ? savedRun.selectedAnswer ?? null : null,
  )
  const [submitted, setSubmitted] = useState(canResume ? Boolean(savedRun.submitted) : false)
  const [answers, setAnswers] = useState(canResume ? savedRun.answers ?? [] : [])
  const [bossHealth, setBossHealth] = useState(canResume ? savedRun.bossHealth ?? 100 : 100)
  const [rewardEligible] = useState(
    () => !player.technologyProgress?.[technologyId]?.bossDefeated,
  )

  if (!technology || !boss) {
    return <BattleMessage message="No boss encounter exists at this location." title="Boss not found" />
  }

  if (!allMissionsComplete) {
    return (
      <BattleMessage
        action="VIEW MISSIONS"
        message={`Complete all ${worldMissions.length} ${technology.name} missions before entering the arena.`}
        technologyId={technologyId}
        title="Boss battle locked"
      />
    )
  }

  if (questions.length < 5) {
    return (
      <BattleMessage
        message="The battle archive does not contain enough questions for this encounter."
        technologyId={technologyId}
        title="Battle data unavailable"
      />
    )
  }

  const currentQuestion = questions[questionIndex]
  const alreadyDefeated = Boolean(player.technologyProgress?.[technologyId]?.bossDefeated)

  const startBattle = () => {
    setQuestionIndex(0)
    setSelectedAnswer(null)
    setSubmitted(false)
    setAnswers([])
    setBossHealth(100)
    startRun({
      technologyId,
      missionId: boss.id,
      mode: 'boss',
      questionIds: questions.map((question) => question.id),
    })
    setPhase('playing')
  }

  const submitAnswer = () => {
    if (submitted || selectedAnswer == null) {
      return
    }

    const correct = isAnswerCorrect(currentQuestion, selectedAnswer)
    const nextBossHealth = correct
      ? Math.max(0, bossHealth - (boss.damagePerCorrectAnswer ?? 20))
      : bossHealth
    const nextAnswers = [...answers, {
      questionId: currentQuestion.id,
      correct,
      selectedAnswer,
    }]
    setBossHealth(nextBossHealth)
    setAnswers(nextAnswers)
    setSubmitted(true)
    recordAnswer({ question: currentQuestion, correct, technologyId, mode: 'boss' })
    saveRunProgress({
      currentIndex: questionIndex,
      answers: nextAnswers,
      bossHealth: nextBossHealth,
      selectedAnswer,
      submitted: true,
    })
  }

  const advance = () => {
    if (bossHealth <= 0) {
      defeatBoss(boss)
      setPhase('won')
      return
    }

    if (player.hearts <= 0 || questionIndex >= questions.length - 1) {
      saveRunProgress({ status: 'failed', bossHealth, answers })
      setPhase('lost')
      return
    }

    const nextIndex = questionIndex + 1
    setQuestionIndex(nextIndex)
    setSelectedAnswer(null)
    setSubmitted(false)
    saveRunProgress({
      currentIndex: nextIndex,
      bossHealth,
      answers,
      selectedAnswer: null,
      submitted: false,
    })
  }

  if (phase === 'intro') {
    return (
      <div className="page-container boss-page">
        <Link className="back-link" to={`/technology/${technologyId}`}>← RETREAT TO {technology.name.toUpperCase()} WORLD</Link>
        <section className="game-card boss-intro" aria-labelledby="boss-title">
          <div className="boss-sigil" aria-hidden="true">⚔</div>
          <p className="page-eyebrow">FINAL ENCOUNTER // {technology.name}</p>
          <h1 className="page-title" id="boss-title">{boss.bossName ?? boss.name}</h1>
          <p className="mission-story">{boss.story}</p>
          <div className="boss-rules">
            <span>100 boss HP</span>
            <span>−{boss.damagePerCorrectAnswer ?? 20} HP per correct answer</span>
            <span>3 player hearts</span>
            <span>+{boss.rewardXP} XP · +{boss.rewardCoins} coins</span>
          </div>
          {alreadyDefeated && <p className="inline-notice">Rematch mode: the conquest reward has already been claimed.</p>}
          <button className="btn btn-danger" onClick={startBattle} type="button">
            {alreadyDefeated ? 'START REMATCH' : 'BEGIN BOSS BATTLE'}
          </button>
        </section>
      </div>
    )
  }

  if (phase === 'won') {
    return (
      <section className="page-container result-screen boss-victory" aria-labelledby="victory-title">
        <div className="result-emblem" aria-hidden="true">⚔</div>
        <p className="page-eyebrow">WORLD SECURED</p>
        <h1 className="page-title" id="victory-title">BOSS DEFEATED</h1>
        <p className="page-description">{boss.bossName ?? boss.name} has fallen. You mastered the {technology.name} world.</p>
        <div className="result-grid">
          <article><span>Correct strikes</span><strong>{answers.filter((answer) => answer.correct).length}</strong></article>
          <article><span>Boss reward</span><strong>+{rewardEligible ? boss.rewardXP : 0} XP</strong></article>
          <article><span>Coins</span><strong>+{rewardEligible ? boss.rewardCoins : 0}</strong></article>
        </div>
        <div className="page-actions">
          <Link className="btn btn-primary" to="/technologies">CHOOSE NEXT WORLD</Link>
          <Link className="btn btn-secondary" to="/achievements">VIEW ACHIEVEMENTS</Link>
        </div>
      </section>
    )
  }

  if (phase === 'lost') {
    return (
      <section className="page-container result-screen result-failed" aria-labelledby="defeat-title">
        <div className="result-emblem" aria-hidden="true">×</div>
        <p className="page-eyebrow">ENCOUNTER LOST</p>
        <h1 className="page-title" id="defeat-title">THE BOSS ENDURES</h1>
        <p className="page-description">Study the attack pattern, restore your hearts, and challenge the arena again.</p>
        <div className="page-actions">
          <button className="btn btn-danger" onClick={startBattle} type="button">RETRY BATTLE</button>
          <Link className="btn btn-secondary" onClick={clearRun} to={`/technology/${technologyId}`}>RETURN TO WORLD</Link>
        </div>
      </section>
    )
  }

  return (
    <div className="page-container boss-battle-page">
      <header className="boss-arena-header">
        <div>
          <p className="page-eyebrow">BOSS ENCOUNTER // {technology.name}</p>
          <h1>{boss.bossName ?? boss.name}</h1>
        </div>
        <HeartDisplay hearts={player.hearts} maxHearts={player.maxHearts} />
      </header>
      <section className={`boss-avatar ${submitted && isAnswerCorrect(currentQuestion, selectedAnswer) ? 'takes-damage' : ''}`} aria-hidden="true">
        <span>{technology.icon}</span>
      </section>
      <BossHealthBar bossName={boss.bossName ?? boss.name} health={bossHealth} />
      <MissionProgress current={questionIndex} label="Battle progress" total={questions.length} />
      <QuestionCard
        autoShowExplanation={player.settings.autoShowExplanation}
        marked={player.revision.markedQuestions.includes(currentQuestion.id)}
        nextLabel={bossHealth <= 0 ? 'LAND FINAL STRIKE' : questionIndex === questions.length - 1 ? 'RESOLVE BATTLE' : 'NEXT ATTACK'}
        onNext={advance}
        onSelect={setSelectedAnswer}
        onSubmit={submitAnswer}
        onToggleMarked={toggleMarkedQuestion}
        question={currentQuestion}
        selectedAnswer={selectedAnswer}
        submitted={submitted}
      />
    </div>
  )
}

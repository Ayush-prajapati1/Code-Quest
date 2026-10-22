import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProgressBar from '../components/common/ProgressBar.jsx'
import HeartDisplay from '../components/game/HeartDisplay.jsx'
import PlayerStats from '../components/game/PlayerStats.jsx'
import XPBar from '../components/game/XPBar.jsx'
import { useGame } from '../context/GameContext.jsx'
import { technologies } from '../data/technologies.js'
import { calculateDashboardAnalytics } from '../utils/analytics.js'
import { getWeeklyStreak } from '../utils/streak.js'
import { getXPProgress } from '../utils/xp.js'

function formatActivityDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const { player } = useGame()
  const [today] = useState(() => new Date())
  const analytics = calculateDashboardAnalytics(player, technologies)
  const xpProgress = getXPProgress(player.totalXP)
  const week = getWeeklyStreak(player.streak.activeDates, today)

  return (
    <div className="page-container dashboard-page">
      <header className="page-hero dashboard-hero">
        <div>
          <p className="page-eyebrow">PLAYER OVERVIEW // LEVEL {player.level}</p>
          <h1 className="page-title">WELCOME, {player.username.toUpperCase()}</h1>
          <p className="page-description">Your command center for progress, accuracy, mastery, and recent quest activity.</p>
        </div>
        <div className="rank-chip"><span>Current rank</span><strong>{player.rank}</strong></div>
      </header>

      <PlayerStats player={player} />

      <section className="dashboard-command-grid">
        <article className="game-card dashboard-xp-card">
          <div className="section-heading-row"><div><p className="page-eyebrow">EXPERIENCE CORE</p><h2>Level progression</h2></div><strong>{player.totalXP.toLocaleString()} total XP</strong></div>
          <XPBar currentXP={xpProgress.currentLevelXP} level={xpProgress.level} requiredXP={xpProgress.requiredForNextLevel} />
          <p>{xpProgress.remainingXP.toLocaleString()} XP until level {player.level + 1}</p>
        </article>
        <article className="game-card dashboard-vitals">
          <p className="page-eyebrow">PLAYER VITALS</p>
          <HeartDisplay hearts={player.hearts} maxHearts={player.maxHearts} />
          <strong>{player.coins.toLocaleString()} coins</strong>
          <Link className="btn btn-secondary" to="/technologies">CONTINUE QUEST</Link>
        </article>
      </section>

      <section aria-labelledby="combat-stats-title">
        <div className="section-heading-row"><div><p className="page-eyebrow">COMBAT DATA</p><h2 className="section-title" id="combat-stats-title">Performance snapshot</h2></div></div>
        <div className="metric-grid">
          <article><span>Questions</span><strong>{analytics.questionsAnswered}</strong></article>
          <article><span>Correct</span><strong>{analytics.correctAnswers}</strong></article>
          <article><span>Wrong</span><strong>{analytics.wrongAnswers}</strong></article>
          <article><span>Accuracy</span><strong>{Math.round(analytics.accuracy)}%</strong></article>
          <article><span>Missions</span><strong>{analytics.completedMissions}</strong></article>
          <article><span>Boss wins</span><strong>{analytics.bossBattlesWon}</strong></article>
          <article><span>Worlds mastered</span><strong>{analytics.technologiesCompleted}</strong></article>
          <article><span>Achievements</span><strong>{analytics.achievementsUnlocked}</strong></article>
        </div>
      </section>

      <section className="analytics-grid">
        <article className="game-card analytics-card">
          <div className="section-heading-row"><div><p className="page-eyebrow">WORLD MASTERY</p><h2>Technology performance</h2></div><span>{Math.round(analytics.missionCompletionPercentage)}% missions</span></div>
          <div className="analytics-list">
            {analytics.technologyAnalytics.map((item) => (
              <div className="analytics-row" key={item.id}>
                <div><strong>{item.name}</strong><span>{item.questionsAnswered ? `${Math.round(item.accuracy)}% accuracy` : 'Not started'}</span></div>
                <ProgressBar compact label={`${item.name} completion`} value={item.completionPercentage} variant="success" />
              </div>
            ))}
          </div>
        </article>
        <div className="analytics-side-stack">
          <article className="game-card analytics-card">
            <p className="page-eyebrow">DIFFICULTY MATRIX</p>
            <h2>Accuracy by tier</h2>
            {analytics.difficultyAnalytics.slice(0, 3).map((item) => (
              <div className="difficulty-row" key={item.difficulty}>
                <span>{item.difficulty}</span>
                <ProgressBar compact label={`${item.difficulty} accuracy`} value={item.accuracy} />
                <strong>{Math.round(item.accuracy)}%</strong>
              </div>
            ))}
          </article>
          <article className="game-card strength-card">
            <div><span>Strongest world</span><strong>{analytics.strongestTechnology?.name ?? 'Awaiting data'}</strong></div>
            <div><span>Training target</span><strong>{analytics.weakestTechnology?.name ?? 'Complete a mission'}</strong></div>
          </article>
        </div>
      </section>

      <section className="dashboard-lower-grid">
        <article className="game-card streak-panel">
          <div className="section-heading-row"><div><p className="page-eyebrow">WEEKLY STREAK</p><h2>{player.streak.current} active days</h2></div><strong>Best {player.streak.longest}</strong></div>
          <div className="streak-week">
            {week.map((day) => <div className={`${day.active ? 'is-active' : ''} ${day.isToday ? 'is-today' : ''}`} key={day.date}><span>{day.day}</span><strong>{day.active ? '●' : '○'}</strong></div>)}
          </div>
        </article>
        <article className="game-card activity-panel">
          <div className="section-heading-row"><div><p className="page-eyebrow">ACTIVITY LOG</p><h2>Recent signals</h2></div></div>
          {analytics.recentActivity.length ? (
            <ol className="activity-list">
              {analytics.recentActivity.slice(0, 8).map((activity) => (
                <li key={activity.id}><span className="activity-marker" aria-hidden="true" /><div><strong>{activity.message}</strong><time dateTime={activity.createdAt}>{formatActivityDate(activity.createdAt)}</time></div></li>
              ))}
            </ol>
          ) : <p className="empty-copy">Complete a mission to start your activity log.</p>}
        </article>
      </section>
    </div>
  )
}

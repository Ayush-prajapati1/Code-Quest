import AchievementCard from '../components/game/AchievementCard.jsx'
import { useGame } from '../context/GameContext.jsx'
import { achievements } from '../data/achievements.js'
import { evaluateAchievements } from '../utils/achievements.js'

export default function Achievements() {
  const { player } = useGame()
  const evaluations = new Map(
    evaluateAchievements(achievements, player).map((item) => [item.id, item]),
  )
  const unlockedRecords = new Map(
    player.achievements.unlocked.map((item) => [typeof item === 'string' ? item : item.id, item]),
  )
  const unlockedCount = unlockedRecords.size
  const completion = achievements.length ? Math.round((unlockedCount / achievements.length) * 100) : 0

  return (
    <section className="page-container achievements-page" aria-labelledby="achievements-title">
      <header className="page-hero achievement-hero">
        <div>
          <p className="page-eyebrow">MILESTONE ARCHIVE</p>
          <h1 className="page-title" id="achievements-title">ACHIEVEMENTS</h1>
          <p className="page-description">Permanent records of your strongest CodeQuest victories.</p>
        </div>
        <div className="achievement-score"><strong>{unlockedCount}/{achievements.length}</strong><span>{completion}% unlocked</span></div>
      </header>

      <div className="achievement-grid">
        {achievements.map((achievement) => {
          const evaluation = evaluations.get(achievement.id)
          const unlocked = unlockedRecords.get(achievement.id) ?? null

          return (
            <AchievementCard
              achievement={achievement}
              key={achievement.id}
              progress={evaluation?.progress ?? 0}
              unlocked={unlocked}
            />
          )
        })}
      </div>
    </section>
  )
}

import ProgressBar from '../common/ProgressBar.jsx'

export default function AchievementCard({ achievement, unlocked, progress = 0 }) {
  const target = Math.max(1, achievement.target ?? achievement.condition?.target ?? 1)

  return (
    <article className={`game-card achievement-card ${unlocked ? 'is-unlocked' : 'is-locked'}`}>
      <div className="achievement-icon" aria-hidden="true">
        {achievement.icon ?? '◆'}
      </div>
      <div className="achievement-copy">
        <div className="achievement-heading">
          <h2>{achievement.name}</h2>
          <span className={`badge ${unlocked ? 'badge-success' : 'badge-muted'}`}>
            {unlocked ? 'Unlocked' : 'Locked'}
          </span>
        </div>
        <p>{achievement.description}</p>
        {!unlocked && (
          <ProgressBar
            compact
            label="Achievement progress"
            max={target}
            value={progress}
            variant="success"
          />
        )}
        {unlocked?.unlockedAt && (
          <time dateTime={unlocked.unlockedAt}>
            Unlocked {new Date(unlocked.unlockedAt).toLocaleDateString()}
          </time>
        )}
      </div>
    </article>
  )
}

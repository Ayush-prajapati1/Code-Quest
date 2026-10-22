import ProgressBar from '../common/ProgressBar.jsx'

export default function MissionProgress({ current, total, label = 'Mission progress' }) {
  return (
    <section className="mission-progress" aria-label={label}>
      <ProgressBar label={label} max={total} value={current} variant="xp" />
      <span className="mission-progress-count">
        Question {Math.min(current + 1, total)} of {total}
      </span>
    </section>
  )
}

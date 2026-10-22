import ProgressBar from '../common/ProgressBar.jsx'

export default function BossHealthBar({ bossName, health, maxHealth = 100 }) {
  return (
    <section className="boss-health" aria-label={`${bossName} health`}>
      <div className="boss-health-heading">
        <span>{bossName}</span>
        <strong>{Math.max(0, health)} HP</strong>
      </div>
      <ProgressBar
        label={`${bossName} health`}
        max={maxHealth}
        value={health}
        variant="danger"
        showValue={false}
      />
    </section>
  )
}

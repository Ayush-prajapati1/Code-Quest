export default function PlayerStats({ player }) {
  const stats = [
    { label: 'Level', value: player.level, meta: player.rank },
    { label: 'Total XP', value: player.totalXP, meta: 'Experience earned' },
    { label: 'Coins', value: player.coins, meta: 'Quest currency' },
    {
      label: 'Current Streak',
      value: `${player.streak.current} ${player.streak.current === 1 ? 'Day' : 'Days'}`,
      meta: 'Keep learning daily',
    },
  ]

  return (
    <section className="dashboard-grid player-stats-grid" aria-label="Player summary">
      {stats.map((stat) => (
        <article className="stat-card dashboard-stat" key={stat.label}>
          <span className="stat-label">{stat.label}</span>
          <strong className="stat-value">{stat.value}</strong>
          <span className="stat-meta">{stat.meta}</span>
        </article>
      ))}
    </section>
  )
}

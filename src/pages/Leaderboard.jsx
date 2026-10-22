import { useGame } from '../context/GameContext.jsx'
import { buildLeaderboard, getPlayerLeaderboardPosition } from '../utils/leaderboard.js'

export default function Leaderboard() {
  const { player } = useGame()
  const leaderboard = buildLeaderboard(player)
  const currentPlayer = getPlayerLeaderboardPosition(leaderboard)
  const podium = leaderboard.slice(0, 3)

  return (
    <section className="page-container leaderboard-page" aria-labelledby="leaderboard-title">
      <header className="page-hero leaderboard-hero">
        <div>
          <p className="page-eyebrow">LOCAL SIMULATION</p>
          <h1 className="page-title" id="leaderboard-title">LEADERBOARD</h1>
          <p className="page-description">Your live local profile is ranked against a fixed roster of CodeQuest challengers. No server required.</p>
        </div>
        <div className="rank-chip"><span>Your position</span><strong>#{currentPlayer?.rank ?? '—'}</strong></div>
      </header>

      <section className="podium" aria-label="Top three players">
        {podium.map((entry, index) => (
          <article className={`game-card podium-card podium-${index + 1} ${entry.isCurrentPlayer ? 'is-player' : ''}`} key={entry.id}>
            <span className="podium-rank">#{entry.rank}</span>
            <div className="podium-avatar" aria-hidden="true">{entry.name.slice(0, 2).toUpperCase()}</div>
            <h2>{entry.name}</h2>
            <strong>{entry.xp.toLocaleString()} XP</strong>
            <span>Level {entry.level}</span>
          </article>
        ))}
      </section>

      <div className="game-card leaderboard-table-wrap">
        <table className="leaderboard-table">
          <caption className="sr-only">CodeQuest player rankings</caption>
          <thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col">Level</th><th scope="col">XP</th><th scope="col">Missions</th></tr></thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr className={entry.isCurrentPlayer ? 'is-player' : ''} key={entry.id}>
                <td data-label="Rank"><strong>#{entry.rank}</strong></td>
                <td data-label="Player"><span className="table-avatar" aria-hidden="true">{entry.name.slice(0, 2).toUpperCase()}</span><strong>{entry.name}</strong>{entry.isCurrentPlayer && <span className="badge badge-primary">YOU</span>}</td>
                <td data-label="Level">{entry.level}</td>
                <td data-label="XP">{entry.xp.toLocaleString()}</td>
                <td data-label="Missions">{entry.missionsCompleted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

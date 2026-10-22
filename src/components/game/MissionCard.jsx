import { Link } from 'react-router-dom'

export default function MissionCard({ mission, technologyId, index, locked, completed }) {
  return (
    <article className={`mission-card-base mission-card ${locked ? 'is-locked' : ''}`}>
      <div className="mission-card-number" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </div>
      <div className="mission-card-copy">
        <div className="cluster">
          <span className={`badge ${completed ? 'badge-success' : locked ? 'badge-muted' : 'badge-primary'}`}>
            {completed ? 'Completed' : locked ? 'Locked' : mission.difficulty}
          </span>
          <span className="mission-topic">{mission.topic}</span>
        </div>
        <h2>{mission.name}</h2>
        <p>{mission.story}</p>
        <dl className="mission-rewards">
          <div>
            <dt>Questions</dt>
            <dd>{mission.requiredQuestions}</dd>
          </div>
          <div>
            <dt>XP</dt>
            <dd>+{mission.rewardXP}</dd>
          </div>
          <div>
            <dt>Coins</dt>
            <dd>+{mission.rewardCoins}</dd>
          </div>
        </dl>
      </div>
      {locked ? (
        <span className="btn btn-ghost" aria-disabled="true">
          COMPLETE PREVIOUS MISSION
        </span>
      ) : (
        <Link className="btn btn-secondary" to={`/mission/${technologyId}/${mission.id}`}>
          {completed ? 'PLAY AGAIN' : 'START MISSION'}
        </Link>
      )}
    </article>
  )
}

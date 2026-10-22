import { Link, useParams } from 'react-router-dom'
import ProgressBar from '../components/common/ProgressBar.jsx'
import MissionCard from '../components/game/MissionCard.jsx'
import { useGame } from '../context/GameContext.jsx'
import { getBossMission, missions } from '../data/missions.js'
import { technologies } from '../data/technologies.js'
import {
  getTechnologyCompletion,
  getTechnologyMissions,
  isMissionCompleted,
  isMissionUnlocked,
  isTechnologyUnlocked,
} from '../utils/gameProgress.js'

export default function TechnologyWorld() {
  const { technologyId } = useParams()
  const { player } = useGame()
  const technology = technologies.find((item) => item.id === technologyId)

  if (!technology) {
    return (
      <section className="page-container error-state" aria-labelledby="world-error-title">
        <span className="error-code">WORLD_NOT_FOUND</span>
        <h1 className="page-title" id="world-error-title">Unknown technology world</h1>
        <p className="page-description">This route does not match a CodeQuest technology.</p>
        <Link className="btn btn-primary" to="/technologies">RETURN TO WORLD SELECT</Link>
      </section>
    )
  }

  const unlocked = isTechnologyUnlocked(player, technologies, missions, technology)

  if (!unlocked) {
    const prerequisite = technologies.find((item) => item.id === technology.prerequisite)

    return (
      <section className="page-container error-state" aria-labelledby="world-locked-title">
        <span className="error-code">ACCESS_LOCKED</span>
        <h1 className="page-title" id="world-locked-title">{technology.name} is locked</h1>
        <p className="page-description">
          Defeat the {prerequisite?.name ?? 'prerequisite'} boss to unlock this world.
        </p>
        <Link className="btn btn-primary" to="/technologies">VIEW AVAILABLE WORLDS</Link>
      </section>
    )
  }

  const worldMissions = getTechnologyMissions(missions, technologyId)
  const completion = getTechnologyCompletion(player, missions, technologyId)
  const boss = getBossMission(technologyId)
  const bossUnlocked = completion.completedMissionCount === worldMissions.length

  return (
    <div className="page-container">
      <header className="page-hero">
        <p className="page-eyebrow terminal-text">TECHNOLOGY WORLD</p>
        <h1 className="page-title">{technology.name.toUpperCase()} WORLD</h1>
        <p className="page-description">{technology.description}</p>
      </header>

      <section
        className="game-card world-overview"
        style={{ '--technology-accent': technology.color ?? technology.accent }}
        aria-labelledby="world-status-title"
      >
        <div>
          <span className="technology-monogram" aria-hidden="true">
            {technology.icon ?? technology.initials}
          </span>
          <div>
            <p className="page-eyebrow">WORLD PROGRESS</p>
            <h2 id="world-status-title">
              {completion.bossDefeated ? 'World mastered' : 'Continue the campaign'}
            </h2>
          </div>
        </div>
        <ProgressBar label="World completion" value={completion.percentage} variant="success" />
        <p>{completion.completedMissionCount} of {worldMissions.length} missions complete</p>
      </section>

      <section className="mission-list" aria-labelledby="mission-list-title">
        <div className="section-heading-row">
          <div>
            <p className="page-eyebrow">CAMPAIGN MAP</p>
            <h2 className="section-title" id="mission-list-title">Missions</h2>
          </div>
          <Link className="btn btn-ghost" to="/technologies">ALL WORLDS</Link>
        </div>
        {worldMissions.map((mission, index) => (
          <MissionCard
            completed={isMissionCompleted(player, technologyId, mission.id)}
            index={index}
            key={mission.id}
            locked={!isMissionUnlocked(player, worldMissions, mission.id)}
            mission={mission}
            technologyId={technologyId}
          />
        ))}
      </section>

      <section className={`game-card boss-gate ${bossUnlocked ? 'is-unlocked' : 'is-locked'}`}>
        <div className="boss-gate-icon" aria-hidden="true">{bossUnlocked ? '⚔' : '⌁'}</div>
        <div>
          <span className={`badge ${completion.bossDefeated ? 'badge-success' : bossUnlocked ? 'badge-danger' : 'badge-muted'}`}>
            {completion.bossDefeated ? 'Defeated' : bossUnlocked ? 'Boss unlocked' : 'Locked'}
          </span>
          <h2>{boss?.bossName ?? boss?.name ?? 'Final Boss'}</h2>
          <p>
            {bossUnlocked
              ? boss?.story
              : `Complete all ${worldMissions.length} missions to enter the boss arena.`}
          </p>
        </div>
        {bossUnlocked ? (
          <Link className="btn btn-danger" to={`/boss/${technologyId}`}>
            {completion.bossDefeated ? 'BATTLE AGAIN' : 'ENTER BOSS BATTLE'}
          </Link>
        ) : (
          <span className="btn btn-ghost" aria-disabled="true">BOSS LOCKED</span>
        )}
      </section>
    </div>
  )
}

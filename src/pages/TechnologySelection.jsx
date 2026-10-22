import TechnologyCard from '../components/game/TechnologyCard.jsx'
import { useGame } from '../context/GameContext.jsx'
import { missions } from '../data/missions.js'
import { technologies } from '../data/technologies.js'
import {
  getTechnologyCompletion,
  isTechnologyUnlocked,
} from '../utils/gameProgress.js'

export default function TechnologySelection() {
  const { player } = useGame()

  return (
    <div className="page-container">
      <header className="page-hero">
        <p className="page-eyebrow terminal-text">WORLD SELECT</p>
        <h1 className="page-title">CHOOSE YOUR WORLD</h1>
        <p className="page-description">Select a technology to begin your adventure.</p>
      </header>

      <section className="technology-grid" aria-label="Technology worlds">
        {technologies.map((technology) => {
          const completion = getTechnologyCompletion(player, missions, technology.id)
          const unlocked = isTechnologyUnlocked(player, technologies, missions, technology)

          return (
            <TechnologyCard
              key={technology.id}
              locked={!unlocked}
              progress={completion.percentage}
              technology={technology}
            />
          )
        })}
      </section>
    </div>
  )
}

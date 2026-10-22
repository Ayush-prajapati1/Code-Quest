import { Link } from 'react-router-dom'
import { useGame } from '../context/GameContext.jsx'

const features = [
  {
    title: 'Choose Your World',
    description: 'Pick a technology and begin a focused learning path.',
  },
  {
    title: 'Complete Missions',
    description: 'Advance through challenges built around practical concepts.',
  },
  {
    title: 'Earn XP',
    description: 'Build momentum and track your progress as a developer.',
  },
  {
    title: 'Defeat Bosses',
    description: 'Put your knowledge to the test in final encounters.',
  },
]

export default function Home() {
  const { player } = useGame()
  const activeRun = player.session?.activeRun
  const resumeRoute = activeRun?.mode === 'mission' && activeRun.technologyId && activeRun.missionId
    ? `/mission/${activeRun.technologyId}/${activeRun.missionId}`
    : '/dashboard'
  const hasProgress = player.stats.questionsAnswered > 0

  return (
    <div className="page-container home-page">
      <section className="page-hero home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy animate-slide-up">
          <p className="page-eyebrow terminal-text">THE DEVELOPER ADVENTURE</p>
          <h1 className="game-title" id="home-title">CODEQUEST</h1>
          <p className="home-tagline">Learn. Battle. Level Up.</p>
          <p className="page-description">
            Master programming technologies through missions, challenges and boss battles.
          </p>
          <div className="page-actions">
            <Link className="btn btn-primary" to="/technologies">START ADVENTURE</Link>
            <Link className="btn btn-secondary" to={resumeRoute}>CONTINUE JOURNEY</Link>
          </div>
        </div>

        <aside className="game-card home-hero-panel" aria-label="Adventure status preview">
          <div className="home-terminal-line">
            <span>QUEST STATUS</span>
            <span className={`badge ${activeRun ? 'badge-warning' : 'badge-success'}`}>
              {activeRun ? 'IN PROGRESS' : 'READY'}
            </span>
          </div>
          <div className="home-orbit" aria-hidden="true">{'</>'}</div>
          <div className="home-panel-copy">
            <p className="page-eyebrow">NEXT OBJECTIVE</p>
            <h2>{activeRun ? 'Resume your active run' : hasProgress ? 'Continue your campaign' : 'Choose your first world'}</h2>
            <p>
              {activeRun
                ? 'Your question, hearts, and answer history are safely stored.'
                : hasProgress
                  ? `Level ${player.level} ${player.rank} — your next quest is ready.`
                  : 'Pick a technology path and prepare for the missions ahead.'}
            </p>
          </div>
        </aside>
      </section>

      <section className="home-feature-section" aria-labelledby="adventure-preview-title">
        <header>
          <p className="page-eyebrow terminal-text">YOUR PATH</p>
          <h2 className="section-title" id="adventure-preview-title">The adventure ahead</h2>
        </header>
        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className="game-card feature-card" key={feature.title}>
              <span className="feature-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

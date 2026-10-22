import { Link } from 'react-router-dom'
import ProgressBar from '../common/ProgressBar.jsx'

export default function TechnologyCard({ technology, progress = 0, locked = false }) {
  return (
    <article
      className={`game-card technology-card ${locked ? 'is-locked' : ''}`}
      style={{ '--technology-accent': technology.color ?? technology.accent }}
    >
      <div className="technology-card-header">
        <span className="technology-monogram" aria-hidden="true">
          {technology.icon ?? technology.initials}
        </span>
        <span className={`badge ${locked ? 'badge-muted' : progress >= 100 ? 'badge-success' : 'badge-primary'}`}>
          {locked ? 'Locked' : progress >= 100 ? 'Mastered' : technology.difficulty}
        </span>
      </div>
      <div className="technology-card-body">
        <h2>{technology.name}</h2>
        <p>{technology.description}</p>
        <ProgressBar
          compact
          label="World completion"
          max={100}
          value={progress}
          variant="success"
        />
      </div>
      <footer className="technology-card-footer">
        <span>{technology.totalMissions} missions</span>
        {locked ? (
          <span className="btn btn-ghost" aria-disabled="true">
            PREREQUISITE REQUIRED
          </span>
        ) : (
          <Link className="btn btn-secondary" to={`/technology/${technology.id}`}>
            ENTER WORLD
          </Link>
        )}
      </footer>
    </article>
  )
}

import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="page-container not-found" aria-labelledby="not-found-title">
      <div>
        <p className="not-found-code">404</p>
        <h1 className="page-title" id="not-found-title">MISSION NOT FOUND</h1>
        <p className="page-description">
          It looks like you entered an unknown part of the CodeQuest world.
        </p>
        <div className="page-actions">
          <Link className="btn btn-primary" to="/">RETURN HOME</Link>
          <Link className="btn btn-secondary" to="/technologies">CHOOSE WORLD</Link>
        </div>
      </div>
    </section>
  )
}

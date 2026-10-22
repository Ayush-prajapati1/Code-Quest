import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useGame } from '../../context/GameContext.jsx'
import { getXPProgress } from '../../utils/xp.js'

const navigationItems = [
  { label: 'Home', to: '/', end: true },
  { label: 'Worlds', to: '/technologies' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Daily Quest', to: '/daily-challenge' },
  { label: 'Revision', to: '/revision' },
  { label: 'Achievements', to: '/achievements' },
  { label: 'Skills', to: '/skill-tree' },
  { label: 'Ranks', to: '/leaderboard' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, logout, user } = useAuth()
  const { player, saveStatus } = useGame()
  const xpProgress = getXPProgress(player.totalXP)

  const closeMenu = () => setMenuOpen(false)
  const isWorldRoute = pathname === '/technologies'
    || pathname.startsWith('/technology/')
    || pathname.startsWith('/mission/')
    || pathname.startsWith('/boss/')

  const handleLogout = () => {
    closeMenu()
    logout()
    navigate('/login', { replace: true })
  }

  const visibleNavigationItems = isAuthenticated
    ? navigationItems
    : navigationItems.filter(({ to }) => to === '/')

  return (
    <header className="site-header">
      <div className="nav-shell">
        <NavLink
          className="brand-link"
          to="/"
          aria-label="CodeQuest home"
          onClick={closeMenu}
        >
          <span className="brand-mark" aria-hidden="true">{'</>'}</span>
          <span>CODEQUEST</span>
        </NavLink>

        <button
          className="nav-menu-button"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          <span
            className={`nav-menu-icon ${menuOpen ? 'is-open' : ''}`}
            aria-hidden="true"
          />
        </button>

        <nav
          id="primary-navigation"
          className={`primary-nav ${menuOpen ? 'is-open' : ''}`}
          aria-label="Primary navigation"
        >
          <div className="nav-links">
            {visibleNavigationItems.map(({ label, to, end }) => (
              <NavLink
                key={to}
                className={({ isActive }) => {
                  const active = isActive || (to === '/technologies' && isWorldRoute)
                  return `nav-link${active ? ' active' : ''}`
                }}
                to={to}
                end={end}
                onClick={closeMenu}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {isAuthenticated ? (
            <div className="nav-player" aria-label="Player summary">
              <span className="nav-player-identity" title={user?.email}>
                <span>Player</span>
                <strong>{user?.name || player.username}</strong>
              </span>
              <span
                className="nav-player-stat"
                aria-label={`Level ${player.level}`}
              >
                <span>Level</span>
                <strong>{player.level}</strong>
              </span>
              <span
                className="nav-player-stat"
                aria-label={`${xpProgress.currentLevelXP} of ${xpProgress.requiredForNextLevel} XP to the next level`}
              >
                <span>XP</span>
                <strong>{xpProgress.currentLevelXP}/{xpProgress.requiredForNextLevel}</strong>
              </span>
              <span
                className="nav-player-stat"
                aria-label={`${player.coins} Coins`}
              >
                <span>Coins</span>
                <strong>{player.coins}</strong>
              </span>
              <span className={`nav-save-status is-${saveStatus}`} aria-live="polite">
                {saveStatus === 'saving' && 'Saving…'}
                {saveStatus === 'saved' && 'Saved'}
                {saveStatus === 'offline' && 'Cached'}
              </span>
              <NavLink className="nav-settings-link" to="/settings" aria-label="Open settings" onClick={closeMenu}>
                ⚙
              </NavLink>
              <button className="nav-logout-button" onClick={handleLogout} type="button">LOG OUT</button>
            </div>
          ) : (
            <div className="nav-auth-actions">
              <NavLink className="btn btn-ghost" to="/login" onClick={closeMenu}>LOGIN</NavLink>
              <NavLink className="btn btn-primary" to="/register" onClick={closeMenu}>REGISTER</NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import LevelUpModal from '../game/LevelUpModal.jsx'
import { useGame } from '../../context/GameContext.jsx'
import Navbar from './Navbar.jsx'
import ScrollToTop from './ScrollToTop.jsx'

export default function AppLayout() {
  const { pathname } = useLocation()
  const {
    dismissLevelUp,
    levelUpNotification,
    player,
    updateLastVisitedRoute,
  } = useGame()

  useEffect(() => {
    updateLastVisitedRoute(pathname)
  }, [pathname, updateLastVisitedRoute])

  return (
    <div className={`app-shell ${player.settings.animationsEnabled ? '' : 'animations-disabled'}`}>
      <Navbar />
      <main className="app-main">
        <ScrollToTop />
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>CODEQUEST // DEVELOPER ADVENTURE</span>
          <span>LEARN. BATTLE. LEVEL UP.</span>
        </div>
      </footer>
      <LevelUpModal notification={levelUpNotification} onClose={dismissLevelUp} />
    </div>
  )
}

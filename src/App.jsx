import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'

const Achievements = lazy(() => import('./pages/Achievements.jsx'))
const BossBattle = lazy(() => import('./pages/BossBattle.jsx'))
const DailyChallenge = lazy(() => import('./pages/DailyChallenge.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Mission = lazy(() => import('./pages/Mission.jsx'))
const Register = lazy(() => import('./pages/Register.jsx'))
const RevisionArena = lazy(() => import('./pages/RevisionArena.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const SkillTree = lazy(() => import('./pages/SkillTree.jsx'))
const TechnologySelection = lazy(() => import('./pages/TechnologySelection.jsx'))
const TechnologyWorld = lazy(() => import('./pages/TechnologyWorld.jsx'))

function RouteFallback() {
  return (
    <div className="route-loader" role="status">
      <span className="route-loader-mark" aria-hidden="true">{'</>'}</span>
      <span>Loading CodeQuest sector…</span>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="technologies" element={<TechnologySelection />} />
            <Route path="technology/:technologyId" element={<TechnologyWorld />} />
            <Route path="mission/:technologyId/:missionId" element={<Mission />} />
            <Route path="boss/:technologyId" element={<BossBattle />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="skill-tree" element={<SkillTree />} />
            <Route path="revision" element={<RevisionArena />} />
            <Route path="daily-challenge" element={<DailyChallenge />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

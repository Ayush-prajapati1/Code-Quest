import { useState } from 'react'
import Modal from '../components/common/Modal.jsx'
import { useGame } from '../context/GameContext.jsx'

function SettingSwitch({ checked, description, label, onChange }) {
  return (
    <label className="setting-row">
      <span><strong>{label}</strong><small>{description}</small></span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  )
}

export default function Settings() {
  const { player, resetPlayer, updateSettings, updateUsername } = useGame()
  const [username, setUsername] = useState(player.username)
  const [resetOpen, setResetOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const saveProfile = (event) => {
    event.preventDefault()
    updateUsername(username)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const confirmReset = () => {
    const freshPlayer = resetPlayer()
    setUsername(freshPlayer.username)
    setResetOpen(false)
  }

  return (
    <section className="page-container settings-page" aria-labelledby="settings-title">
      <header className="page-hero">
        <p className="page-eyebrow">SYSTEM CONTROLS</p>
        <h1 className="page-title" id="settings-title">SETTINGS</h1>
        <p className="page-description">Tune your player profile, feedback preferences, and accessibility experience.</p>
      </header>

      <div className="settings-grid">
        <section className="game-card settings-card" aria-labelledby="profile-settings-title">
          <p className="page-eyebrow">PLAYER IDENTITY</p>
          <h2 id="profile-settings-title">Profile</h2>
          <form onSubmit={saveProfile}>
            <label className="field-label" htmlFor="username">Display name</label>
            <input
              id="username"
              maxLength="30"
              onChange={(event) => setUsername(event.target.value)}
              required
              type="text"
              value={username}
            />
            <div className="setting-save-row">
              <button className="btn btn-primary" type="submit">SAVE PROFILE</button>
              <span aria-live="polite">{saved ? 'Profile saved.' : ''}</span>
            </div>
          </form>
        </section>

        <section className="game-card settings-card" aria-labelledby="experience-settings-title">
          <p className="page-eyebrow">EXPERIENCE</p>
          <h2 id="experience-settings-title">Game preferences</h2>
          <SettingSwitch
            checked={player.settings.soundEnabled}
            description="Enable interface and reward sound cues when available."
            label="Sound effects"
            onChange={(soundEnabled) => updateSettings({ soundEnabled })}
          />
          <SettingSwitch
            checked={player.settings.animationsEnabled}
            description="Turn off motion without changing gameplay."
            label="Interface animations"
            onChange={(animationsEnabled) => updateSettings({ animationsEnabled })}
          />
          <SettingSwitch
            checked={player.settings.autoShowExplanation}
            description="Reveal the explanation immediately after submitting."
            label="Auto-show explanations"
            onChange={(autoShowExplanation) => updateSettings({ autoShowExplanation })}
          />
          <label className="setting-select" htmlFor="difficulty-preference">
            <span><strong>Difficulty preference</strong><small>Used when future mixed practice sets are assembled.</small></span>
            <select
              id="difficulty-preference"
              onChange={(event) => updateSettings({ difficultyPreference: event.target.value })}
              value={player.settings.difficultyPreference}
            >
              <option value="relaxed">Relaxed</option>
              <option value="balanced">Balanced</option>
              <option value="challenging">Challenging</option>
            </select>
          </label>
        </section>

        <section className="game-card settings-card danger-zone" aria-labelledby="reset-settings-title">
          <p className="page-eyebrow">DANGER ZONE</p>
          <h2 id="reset-settings-title">Reset adventure</h2>
          <p>This replaces the saved adventure for your account, including XP, coins, missions, achievements, revision items, and settings. Your account is not deleted.</p>
          <button className="btn btn-danger" onClick={() => setResetOpen(true)} type="button">RESET ALL PROGRESS</button>
        </section>
      </div>

      <Modal
        actions={(
          <>
            <button className="btn btn-ghost" onClick={() => setResetOpen(false)} type="button">CANCEL</button>
            <button className="btn btn-danger" onClick={confirmReset} type="button">YES, RESET EVERYTHING</button>
          </>
        )}
        description="This permanently replaces your cloud progress and this device's cached copy with a fresh adventure."
        onClose={() => setResetOpen(false)}
        open={resetOpen}
        title="Reset all progress?"
        variant="danger"
      >
        <p>Your current level is {player.level} with {player.totalXP} total XP. The account will remain, but its game progress cannot be restored after the next cloud save.</p>
      </Modal>
    </section>
  )
}

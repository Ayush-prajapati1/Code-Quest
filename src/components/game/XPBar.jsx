import ProgressBar from '../common/ProgressBar.jsx'

export default function XPBar({ currentXP, requiredXP, level }) {
  return (
    <section className="xp-bar" aria-label={`Level ${level} experience`}>
      <div className="xp-bar-heading">
        <span>Level {level} progress</span>
        <strong>{currentXP} / {requiredXP} XP</strong>
      </div>
      <ProgressBar
        label={`Level ${level} experience`}
        max={requiredXP}
        value={currentXP}
        variant="xp"
        showValue={false}
      />
    </section>
  )
}

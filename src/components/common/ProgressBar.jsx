export default function ProgressBar({
  value = 0,
  max = 100,
  label = 'Progress',
  variant = 'xp',
  showValue = true,
  compact = false,
}) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1
  const safeValue = Number.isFinite(value)
    ? Math.min(safeMax, Math.max(0, value))
    : 0
  const percentage = Math.round((safeValue / safeMax) * 100)

  return (
    <div className={`progress-widget ${compact ? 'progress-widget-compact' : ''}`}>
      {(label || showValue) && (
        <div className="progress-meta">
          <span>{label}</span>
          {showValue && <span>{percentage}%</span>}
        </div>
      )}
      <div
        aria-label={label}
        aria-valuemax={safeMax}
        aria-valuemin={0}
        aria-valuenow={safeValue}
        className={`progress-track progress-${variant}`}
        role="progressbar"
      >
        <span className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

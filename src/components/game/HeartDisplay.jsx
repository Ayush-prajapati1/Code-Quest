export default function HeartDisplay({ hearts, maxHearts }) {
  const safeMaxHearts = Number.isFinite(maxHearts) ? Math.max(0, Math.floor(maxHearts)) : 0
  const safeHearts = Number.isFinite(hearts)
    ? Math.min(safeMaxHearts, Math.max(0, Math.floor(hearts)))
    : 0

  return (
    <span className="heart-display" aria-label={`${safeHearts} of ${safeMaxHearts} hearts`}>
      <span className="heart-display-icons" aria-hidden="true">
        {Array.from({ length: safeMaxHearts }, (_, index) => (index < safeHearts ? '♥' : '♡')).join(
          ' ',
        )}
      </span>
      <span className="heart-display-text">
        {safeHearts} / {safeMaxHearts} Hearts
      </span>
    </span>
  )
}

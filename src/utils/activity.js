export const ACTIVITY_TYPES = Object.freeze({
  MISSION_COMPLETED: 'mission-completed',
  BOSS_DEFEATED: 'boss-defeated',
  ACHIEVEMENT_UNLOCKED: 'achievement-unlocked',
  LEVEL_UP: 'level-up',
  DAILY_CHALLENGE_COMPLETED: 'daily-challenge-completed',
})

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function getTimestamp(value) {
  const timestamp = Date.parse(value)

  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function createActivityEntry({
  id,
  type,
  message,
  createdAt,
  metadata = {},
} = {}) {
  const normalizedType = String(type ?? '').trim()
  const normalizedDate =
    typeof createdAt === 'string' && !Number.isNaN(Date.parse(createdAt))
      ? createdAt
      : null

  if (!normalizedType || !normalizedDate) {
    return null
  }

  return {
    id: String(id ?? `${normalizedType}-${normalizedDate}`),
    type: normalizedType,
    message: String(message ?? '').trim(),
    createdAt: normalizedDate,
    metadata: isRecord(metadata) ? { ...metadata } : {},
  }
}

export function sortActivities(activities) {
  if (!Array.isArray(activities)) {
    return []
  }

  return [...activities].sort(
    (left, right) =>
      getTimestamp(right?.createdAt) - getTimestamp(left?.createdAt),
  )
}

export function appendRecentActivity(
  activities,
  activity,
  maximumEntries = 20,
) {
  const normalizedActivity = createActivityEntry(activity)

  if (!normalizedActivity) {
    return sortActivities(activities)
  }

  const limit =
    typeof maximumEntries === 'number' && Number.isFinite(maximumEntries)
      ? Math.max(1, Math.floor(maximumEntries))
      : 20
  const currentActivities = Array.isArray(activities) ? activities : []
  const withoutDuplicate = currentActivities.filter(
    (entry) => entry?.id !== normalizedActivity.id,
  )

  return sortActivities([normalizedActivity, ...withoutDuplicate]).slice(0, limit)
}

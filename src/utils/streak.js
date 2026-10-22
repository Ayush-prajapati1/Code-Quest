const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY_IN_MILLISECONDS = 86_400_000

function isValidDateParts(year, month, day) {
  const candidate = new Date(Date.UTC(year, month - 1, day))

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  )
}

function formatLocalDate(date) {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function toDateKey(value) {
  if (typeof value === 'string') {
    const match = DATE_KEY_PATTERN.exec(value)

    if (match) {
      const year = Number(match[1])
      const month = Number(match[2])
      const day = Number(match[3])

      return isValidDateParts(year, month, day) ? value : null
    }
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)

  return Number.isNaN(date.getTime()) ? null : formatLocalDate(date)
}

function dateKeyToTimestamp(dateKey) {
  const normalizedDate = toDateKey(dateKey)

  if (!normalizedDate) {
    return null
  }

  const [year, month, day] = normalizedDate.split('-').map(Number)

  return Date.UTC(year, month - 1, day)
}

export function getDayDifference(fromDate, toDate) {
  const fromTimestamp = dateKeyToTimestamp(fromDate)
  const toTimestamp = dateKeyToTimestamp(toDate)

  if (fromTimestamp === null || toTimestamp === null) {
    return null
  }

  return Math.round((toTimestamp - fromTimestamp) / DAY_IN_MILLISECONDS)
}

function getUniqueSortedDateKeys(activeDates) {
  if (!Array.isArray(activeDates)) {
    return []
  }

  return [
    ...new Set(activeDates.map(toDateKey).filter((dateKey) => dateKey !== null)),
  ].sort()
}

function toNonNegativeWholeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0
}

export function calculateStreak(activeDates, asOfDate) {
  const normalizedDates = getUniqueSortedDateKeys(activeDates)

  if (normalizedDates.length === 0) {
    return {
      current: 0,
      longest: 0,
      lastActiveDate: null,
      activeDates: [],
    }
  }

  let longest = 1
  let running = 1

  for (let index = 1; index < normalizedDates.length; index += 1) {
    if (getDayDifference(normalizedDates[index - 1], normalizedDates[index]) === 1) {
      running += 1
      longest = Math.max(longest, running)
    } else {
      running = 1
    }
  }

  const lastActiveDate = normalizedDates.at(-1)
  const referenceDate = toDateKey(asOfDate) ?? lastActiveDate
  const daysSinceActivity = getDayDifference(lastActiveDate, referenceDate)
  const current =
    daysSinceActivity === 0 || daysSinceActivity === 1 ? running : 0

  return {
    current,
    longest,
    lastActiveDate,
    activeDates: normalizedDates,
  }
}

export function updateStreak(streak, activityDate) {
  const dateKey = toDateKey(activityDate)
  const previousStreak =
    streak !== null && typeof streak === 'object' ? streak : {}

  if (!dateKey) {
    return {
      current: toNonNegativeWholeNumber(previousStreak.current),
      longest: toNonNegativeWholeNumber(previousStreak.longest),
      lastActiveDate: toDateKey(previousStreak.lastActiveDate),
      activeDates: getUniqueSortedDateKeys(previousStreak.activeDates),
    }
  }

  const activeDates = getUniqueSortedDateKeys([
    ...(Array.isArray(previousStreak.activeDates)
      ? previousStreak.activeDates
      : []),
    previousStreak.lastActiveDate,
    dateKey,
  ])
  const calculatedStreak = calculateStreak(activeDates, activeDates.at(-1))

  return {
    ...calculatedStreak,
    longest: Math.max(
      calculatedStreak.longest,
      toNonNegativeWholeNumber(previousStreak.longest),
    ),
  }
}

export function getWeeklyStreak(activeDates, referenceDate) {
  const referenceKey = toDateKey(referenceDate)

  if (!referenceKey) {
    return []
  }

  const activeDateSet = new Set(getUniqueSortedDateKeys(activeDates))
  const referenceTimestamp = dateKeyToTimestamp(referenceKey)
  const referenceDay = new Date(referenceTimestamp).getUTCDay()
  const mondayOffset = referenceDay === 0 ? -6 : 1 - referenceDay

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      referenceTimestamp + (mondayOffset + index) * DAY_IN_MILLISECONDS,
    )
    const dateKey = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
    ].join('-')

    return {
      date: dateKey,
      day: date.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        weekday: 'short',
      }),
      active: activeDateSet.has(dateKey),
      isToday: dateKey === referenceKey,
    }
  })
}

export const recordStreakActivity = updateStreak

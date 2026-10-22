export const BASE_LEVEL_XP = 500
export const LEVEL_XP_GROWTH = 200
export const TIER_XP_GROWTH = 100
export const LEVELS_PER_TIER = 2
export const MAX_LEVEL = 1_000_000

function toSafeWholeNumber(value, fallback = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)))
}

export function normalizeXP(value) {
  return toSafeWholeNumber(value)
}

export function normalizeLevel(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 1
  }

  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(value)))
}

export function getXPRequiredForNextLevel(level) {
  const normalizedLevel = normalizeLevel(level)

  if (normalizedLevel >= MAX_LEVEL) {
    return 0
  }

  const completedLevelCount = normalizedLevel - 1
  const tierCount = Math.floor(completedLevelCount / LEVELS_PER_TIER)

  return toSafeWholeNumber(
    BASE_LEVEL_XP +
      completedLevelCount * LEVEL_XP_GROWTH +
      tierCount * TIER_XP_GROWTH,
  )
}

export function getXPThresholdForLevel(level) {
  const normalizedLevel = normalizeLevel(level)
  const completedLevelCount = normalizedLevel - 1
  const pairedTierCount = Math.floor(completedLevelCount / LEVELS_PER_TIER)
  const tierGrowthSum =
    completedLevelCount % LEVELS_PER_TIER === 0
      ? pairedTierCount * (pairedTierCount - 1)
      : pairedTierCount * pairedTierCount

  return toSafeWholeNumber(
    completedLevelCount * BASE_LEVEL_XP +
      (LEVEL_XP_GROWTH * completedLevelCount * (completedLevelCount - 1)) /
        2 +
      TIER_XP_GROWTH * tierGrowthSum,
  )
}

export const getXPForLevel = getXPThresholdForLevel

export function calculateLevel(totalXP) {
  const normalizedXP = normalizeXP(totalXP)
  let lowerLevel = 1
  let upperLevel = 2

  while (
    upperLevel < MAX_LEVEL &&
    getXPThresholdForLevel(upperLevel) <= normalizedXP
  ) {
    lowerLevel = upperLevel
    upperLevel = Math.min(MAX_LEVEL, upperLevel * 2)
  }

  while (lowerLevel < upperLevel) {
    const candidateLevel = Math.ceil((lowerLevel + upperLevel) / 2)

    if (getXPThresholdForLevel(candidateLevel) <= normalizedXP) {
      lowerLevel = candidateLevel
    } else {
      upperLevel = candidateLevel - 1
    }
  }

  return lowerLevel
}

export function getXPProgress(totalXP) {
  const normalizedXP = normalizeXP(totalXP)
  const level = calculateLevel(normalizedXP)
  const levelStartXP = getXPThresholdForLevel(level)
  const isMaxLevel = level >= MAX_LEVEL
  const requiredForNextLevel = isMaxLevel
    ? 0
    : getXPRequiredForNextLevel(level)
  const currentLevelXP = isMaxLevel
    ? 0
    : Math.max(0, normalizedXP - levelStartXP)
  const progressPercentage = isMaxLevel
    ? 100
    : Math.min(100, (currentLevelXP / requiredForNextLevel) * 100)

  return {
    level,
    totalXP: normalizedXP,
    levelStartXP,
    nextLevelXP: isMaxLevel
      ? null
      : getXPThresholdForLevel(level + 1),
    currentLevelXP,
    requiredForNextLevel,
    remainingXP: isMaxLevel
      ? 0
      : Math.max(0, requiredForNextLevel - currentLevelXP),
    progressPercentage,
    isMaxLevel,
  }
}

export function addXP(totalXP, amount) {
  const previousProgress = getXPProgress(totalXP)
  const xpAdded = normalizeXP(amount)
  const nextTotalXP = toSafeWholeNumber(previousProgress.totalXP + xpAdded)
  const nextProgress = getXPProgress(nextTotalXP)

  return {
    ...nextProgress,
    previousLevel: previousProgress.level,
    xpAdded: nextTotalXP - previousProgress.totalXP,
    levelsGained: Math.max(0, nextProgress.level - previousProgress.level),
    leveledUp: nextProgress.level > previousProgress.level,
  }
}

export function calculateXP(totalXP, amount = 0) {
  return amount === 0 ? getXPProgress(totalXP) : addXP(totalXP, amount)
}

export const awardXP = addXP
export const calculateXPProgress = getXPProgress

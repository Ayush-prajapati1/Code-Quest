import {
  calculateLevel,
  getXPProgress,
  normalizeLevel,
} from './xp.js'

export { calculateLevel } from './xp.js'

export const PLAYER_RANKS = Object.freeze([
  Object.freeze({ name: 'Beginner Coder', minimumLevel: 1 }),
  Object.freeze({ name: 'Code Explorer', minimumLevel: 2 }),
  Object.freeze({ name: 'Code Warrior', minimumLevel: 4 }),
  Object.freeze({ name: 'Bug Hunter', minimumLevel: 6 }),
  Object.freeze({ name: 'Algorithm Knight', minimumLevel: 9 }),
  Object.freeze({ name: 'Senior Developer', minimumLevel: 12 }),
  Object.freeze({ name: 'Code Master', minimumLevel: 16 }),
  Object.freeze({ name: 'Tech Champion', minimumLevel: 21 }),
  Object.freeze({ name: 'Grandmaster Developer', minimumLevel: 30 }),
])

function getRankIndex(level) {
  const normalizedLevel = normalizeLevel(level)

  for (let index = PLAYER_RANKS.length - 1; index >= 0; index -= 1) {
    if (normalizedLevel >= PLAYER_RANKS[index].minimumLevel) {
      return index
    }
  }

  return 0
}

export function getRank(level) {
  return PLAYER_RANKS[getRankIndex(level)].name
}

export function getRankDetails(level) {
  const normalizedLevel = normalizeLevel(level)
  const rankIndex = getRankIndex(normalizedLevel)
  const currentRank = PLAYER_RANKS[rankIndex]
  const nextRank = PLAYER_RANKS[rankIndex + 1] ?? null
  const levelsInRank = nextRank
    ? nextRank.minimumLevel - currentRank.minimumLevel
    : 0
  const levelsCompleted = nextRank
    ? normalizedLevel - currentRank.minimumLevel
    : 0

  return {
    ...currentRank,
    level: normalizedLevel,
    nextRank,
    levelsUntilNextRank: nextRank
      ? Math.max(0, nextRank.minimumLevel - normalizedLevel)
      : 0,
    progressPercentage: nextRank
      ? Math.min(100, (levelsCompleted / levelsInRank) * 100)
      : 100,
    isHighestRank: nextRank === null,
  }
}

export function getRankForXP(totalXP) {
  return getRank(calculateLevel(totalXP))
}

export function getLevelSummary(totalXP) {
  const progress = getXPProgress(totalXP)

  return {
    ...progress,
    rank: getRank(progress.level),
    rankDetails: getRankDetails(progress.level),
  }
}

export const getLevelProgress = getXPProgress

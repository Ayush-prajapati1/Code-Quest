import { getUnlockedAchievementIds } from './achievements.js'
import { sortActivities } from './activity.js'

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function toNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : 0
}

function toCount(value) {
  return Math.floor(toNonNegativeNumber(value))
}

function getCount(value) {
  return Array.isArray(value) ? value.length : toCount(value)
}

function getTechnologyId(technology) {
  if (typeof technology === 'string') {
    return technology
  }

  return String(technology?.id ?? technology?.technologyId ?? '')
}

function getTechnologyName(technology, id) {
  return String(technology?.name ?? technology?.title ?? id)
}

export function calculateAccuracy(correctAnswers, questionsAnswered) {
  const total = toCount(questionsAnswered)

  if (total === 0) {
    return 0
  }

  const correct = Math.min(total, toCount(correctAnswers))

  return (correct / total) * 100
}

export function calculateCompletionPercentage(completed, total) {
  const normalizedTotal = toCount(total)

  if (normalizedTotal === 0) {
    return 0
  }

  return Math.min(100, (getCount(completed) / normalizedTotal) * 100)
}

function getProgressStats(progress) {
  const stats = isRecord(progress?.stats) ? progress.stats : progress
  const questionsAnswered = toCount(
    stats?.questionsAnswered ?? stats?.totalQuestions ?? stats?.answered,
  )
  const correctAnswers = Math.min(
    questionsAnswered,
    toCount(stats?.correctAnswers ?? stats?.correct),
  )
  const explicitWrongAnswers = stats?.wrongAnswers ?? stats?.incorrectAnswers ?? stats?.wrong
  const wrongAnswers =
    explicitWrongAnswers === undefined
      ? Math.max(0, questionsAnswered - correctAnswers)
      : Math.min(questionsAnswered, toCount(explicitWrongAnswers))

  return { questionsAnswered, correctAnswers, wrongAnswers }
}

export function calculateTechnologyAnalytics(player, technologies = []) {
  const technologyProgress = isRecord(player?.technologyProgress)
    ? player.technologyProgress
    : {}
  const technologyMap = new Map()

  if (Array.isArray(technologies)) {
    technologies.forEach((technology) => {
      const id = getTechnologyId(technology)

      if (id) {
        technologyMap.set(id, technology)
      }
    })
  }

  Object.keys(technologyProgress).forEach((id) => {
    if (!technologyMap.has(id)) {
      technologyMap.set(id, { id, name: id })
    }
  })

  return [...technologyMap.entries()].map(([id, technology]) => {
    const progress = isRecord(technologyProgress[id])
      ? technologyProgress[id]
      : {}
    const stats = getProgressStats(progress)
    const completedMissions = getCount(progress.completedMissions)
    const totalMissions = getCount(
      technology?.totalMissions ??
        progress.totalMissions ??
        technology?.missions?.length,
    )
    const calculatedCompletion = calculateCompletionPercentage(
      completedMissions,
      totalMissions,
    )
    const completionPercentage = Math.min(
      100,
      toNonNegativeNumber(
        progress.completionPercentage ?? progress.progress ?? calculatedCompletion,
      ),
    )
    const completed = Boolean(
      progress.completed ||
        progress.bossDefeated ||
        (totalMissions > 0 && completedMissions >= totalMissions) ||
        completionPercentage >= 100,
    )

    return {
      id,
      name: getTechnologyName(technology, id),
      ...stats,
      accuracy: calculateAccuracy(
        stats.correctAnswers,
        stats.questionsAnswered,
      ),
      completedMissions,
      totalMissions,
      completionPercentage,
      bossDefeated: Boolean(progress.bossDefeated),
      completed,
    }
  })
}

function addDifficultyStats(target, source) {
  if (!isRecord(source)) {
    return
  }

  Object.entries(source).forEach(([difficulty, progress]) => {
    if (!isRecord(progress)) {
      return
    }

    const key = difficulty.toLowerCase()
    const stats = getProgressStats(progress)
    const existing = target[key] ?? {
      questionsAnswered: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
    }

    target[key] = {
      questionsAnswered: existing.questionsAnswered + stats.questionsAnswered,
      correctAnswers: existing.correctAnswers + stats.correctAnswers,
      wrongAnswers: existing.wrongAnswers + stats.wrongAnswers,
    }
  })
}

export function calculateDifficultyAnalytics(player) {
  const totals = {}

  addDifficultyStats(totals, player?.difficultyProgress)
  addDifficultyStats(totals, player?.stats?.byDifficulty)

  if (isRecord(player?.technologyProgress)) {
    Object.values(player.technologyProgress).forEach((progress) => {
      addDifficultyStats(
        totals,
        progress?.difficultyProgress ?? progress?.byDifficulty,
      )
    })
  }

  return ['easy', 'medium', 'hard']
    .map((difficulty) => {
      const stats = totals[difficulty] ?? {
        questionsAnswered: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
      }

      return {
        difficulty,
        ...stats,
        accuracy: calculateAccuracy(
          stats.correctAnswers,
          stats.questionsAnswered,
        ),
      }
    })
    .concat(
      Object.entries(totals)
        .filter(
          ([difficulty]) => !['easy', 'medium', 'hard'].includes(difficulty),
        )
        .map(([difficulty, stats]) => ({
          difficulty,
          ...stats,
          accuracy: calculateAccuracy(
            stats.correctAnswers,
            stats.questionsAnswered,
          ),
        })),
    )
}

function compareTechnologyStrength(left, right) {
  return (
    right.accuracy - left.accuracy ||
    right.questionsAnswered - left.questionsAnswered ||
    right.completionPercentage - left.completionPercentage ||
    left.name.localeCompare(right.name)
  )
}

export function getStrongestTechnology(technologyAnalytics) {
  const playedTechnologies = Array.isArray(technologyAnalytics)
    ? technologyAnalytics.filter((technology) => technology.questionsAnswered > 0)
    : []

  return [...playedTechnologies].sort(compareTechnologyStrength)[0] ?? null
}

export function getWeakestTechnology(technologyAnalytics) {
  const playedTechnologies = Array.isArray(technologyAnalytics)
    ? technologyAnalytics.filter((technology) => technology.questionsAnswered > 0)
    : []

  return [...playedTechnologies].sort((left, right) =>
    compareTechnologyStrength(right, left),
  )[0] ?? null
}

export function calculateDashboardAnalytics(player, technologies = []) {
  const stats = getProgressStats(player?.stats ?? {})
  const technologyAnalytics = calculateTechnologyAnalytics(player, technologies)
  const difficultyAnalytics = calculateDifficultyAnalytics(player)
  const totalTechnologyMissions = technologyAnalytics.reduce(
    (total, technology) => total + technology.totalMissions,
    0,
  )
  const completedTechnologyMissions = technologyAnalytics.reduce(
    (total, technology) => total + technology.completedMissions,
    0,
  )

  return {
    questionsAnswered: stats.questionsAnswered,
    correctAnswers: stats.correctAnswers,
    wrongAnswers: stats.wrongAnswers,
    accuracy: calculateAccuracy(stats.correctAnswers, stats.questionsAnswered),
    completedMissions: toCount(player?.stats?.missionsCompleted),
    bossBattlesWon: toCount(player?.stats?.bossBattlesWon),
    technologiesCompleted: technologyAnalytics.filter(
      (technology) => technology.completed,
    ).length,
    achievementsUnlocked: getUnlockedAchievementIds(player?.achievements).length,
    missionCompletionPercentage: calculateCompletionPercentage(
      completedTechnologyMissions,
      totalTechnologyMissions,
    ),
    technologyAnalytics,
    difficultyAnalytics,
    strongestTechnology: getStrongestTechnology(technologyAnalytics),
    weakestTechnology: getWeakestTechnology(technologyAnalytics),
    recentActivity: sortActivities(player?.recentActivity),
  }
}

export const calculateDashboardStats = calculateDashboardAnalytics
export const getTechnologyAnalytics = calculateTechnologyAnalytics
export const getDifficultyAnalytics = calculateDifficultyAnalytics

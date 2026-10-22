function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function toProgressNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : 0
}

function getPathValue(source, path) {
  return String(path)
    .split('.')
    .filter(Boolean)
    .reduce(
      (currentValue, key) =>
        isRecord(currentValue) || Array.isArray(currentValue)
          ? currentValue[key]
          : undefined,
      source,
    )
}

function countCompletedTechnologies(player) {
  const technologyProgress = isRecord(player?.technologyProgress)
    ? player.technologyProgress
    : {}

  return Object.values(technologyProgress).filter((progress) => {
    if (!isRecord(progress)) {
      return false
    }

    return Boolean(
      progress.completed ||
        progress.bossDefeated ||
        progress.completionPercentage >= 100,
    )
  }).length
}

const METRIC_PATHS = Object.freeze({
  questionsAnswered: 'stats.questionsAnswered',
  correctAnswers: 'stats.correctAnswers',
  wrongAnswers: 'stats.wrongAnswers',
  missionsCompleted: 'stats.missionsCompleted',
  bossBattlesWon: 'stats.bossBattlesWon',
  perfectMissions: 'stats.perfectMissions',
  totalPlaySessions: 'stats.totalPlaySessions',
  currentStreak: 'streak.current',
  longestStreak: 'streak.longest',
  level: 'level',
  totalXP: 'totalXP',
  coins: 'coins',
})

export function getAchievementMetric(player, metric) {
  if (typeof metric === 'function') {
    try {
      return toProgressNumber(metric(player))
    } catch {
      return 0
    }
  }

  if (metric === 'completedTechnologies') {
    return countCompletedTechnologies(player)
  }

  if (metric === 'unlockedAchievements') {
    return getUnlockedAchievementIds(player?.achievements).length
  }

  const metricPath = METRIC_PATHS[metric] ?? metric

  return toProgressNumber(getPathValue(player, metricPath))
}

function getAchievementTarget(definition) {
  const target =
    definition?.target ??
    definition?.threshold ??
    definition?.condition?.target ??
    definition?.requirement?.target ??
    definition?.requirement?.value ??
    1

  return Math.max(1, toProgressNumber(target) || 1)
}

function getAchievementMetricDefinition(definition) {
  return (
    definition?.metric ??
    definition?.condition?.type ??
    definition?.requirement?.metric ??
    definition?.requirement?.type ??
    null
  )
}

export function evaluateAchievement(definition, player) {
  if (!isRecord(definition) || !definition.id) {
    return null
  }

  const target = getAchievementTarget(definition)
  let progress = 0
  let conditionResult = null
  const progressResolver =
    definition.getProgress ??
    (typeof definition.progress === 'function' ? definition.progress : null)
  const condition =
    definition.condition ?? definition.isUnlocked ?? definition.predicate

  if (typeof progressResolver === 'function') {
    try {
      progress = toProgressNumber(progressResolver(player))
    } catch {
      progress = 0
    }
  } else if (definition.condition?.type === 'technologyBossDefeated') {
    progress = player?.technologyProgress?.[definition.condition.technologyId]?.bossDefeated ? 1 : 0
  } else if (definition.condition?.type === 'questionTypeCorrect') {
    progress = toProgressNumber(
      player?.stats?.byQuestionType?.[definition.condition.questionType]?.correct,
    )
  } else {
    const metric = getAchievementMetricDefinition(definition)
    progress = metric ? getAchievementMetric(player, metric) : 0
  }

  if (typeof condition === 'function') {
    try {
      conditionResult = Boolean(condition(player))
    } catch {
      conditionResult = false
    }
  }

  const unlocked =
    conditionResult === null ? progress >= target : conditionResult

  if (unlocked && progress === 0 && !getAchievementMetricDefinition(definition)) {
    progress = target
  }

  return {
    id: String(definition.id),
    progress,
    target,
    progressPercentage: Math.min(100, (progress / target) * 100),
    unlocked,
  }
}

export function evaluateAchievements(definitions, player) {
  if (!Array.isArray(definitions)) {
    return []
  }

  return definitions
    .map((definition) => evaluateAchievement(definition, player))
    .filter(Boolean)
}

export function checkAchievement(definition, player) {
  return Boolean(evaluateAchievement(definition, player)?.unlocked)
}

export function getUnlockedAchievementIds(achievements) {
  const unlocked = Array.isArray(achievements?.unlocked)
    ? achievements.unlocked
    : []

  return [
    ...new Set(
      unlocked
        .map((entry) =>
          isRecord(entry) ? entry.id : typeof entry === 'string' ? entry : null,
        )
        .filter(Boolean)
        .map(String),
    ),
  ]
}

export function checkAchievements(definitions, player) {
  const evaluations = evaluateAchievements(definitions, player)
  const unlockedIds = new Set(
    getUnlockedAchievementIds(player?.achievements),
  )
  const newlyUnlocked = evaluations.filter(
    (evaluation) => evaluation.unlocked && !unlockedIds.has(evaluation.id),
  )

  return {
    evaluations,
    newlyUnlocked,
    progress: Object.fromEntries(
      evaluations.map((evaluation) => [
        evaluation.id,
        {
          current: evaluation.progress,
          target: evaluation.target,
          percentage: evaluation.progressPercentage,
        },
      ]),
    ),
  }
}

export function unlockAchievements(
  achievementState,
  definitions,
  player,
  unlockedAt = null,
) {
  const currentState = isRecord(achievementState) ? achievementState : {}
  const existingUnlocked = Array.isArray(currentState.unlocked)
    ? currentState.unlocked
    : []
  const existingIds = new Set(
    getUnlockedAchievementIds({ unlocked: existingUnlocked }),
  )
  const result = checkAchievements(definitions, {
    ...player,
    achievements: currentState,
  })
  const unlockRecords = result.newlyUnlocked
    .filter((achievement) => !existingIds.has(achievement.id))
    .map((achievement) => ({
      id: achievement.id,
      unlockedAt,
    }))

  return {
    achievements: {
      ...currentState,
      unlocked: [...existingUnlocked, ...unlockRecords],
      progress: {
        ...(isRecord(currentState.progress) ? currentState.progress : {}),
        ...result.progress,
      },
    },
    newlyUnlocked: unlockRecords,
    evaluations: result.evaluations,
  }
}

export const applyAchievementUnlocks = unlockAchievements

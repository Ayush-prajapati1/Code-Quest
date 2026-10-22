const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
const SAFE_KEY_PATTERN = /^[A-Za-z0-9_.:-]+$/
const DIFFICULTY_PREFERENCES = new Set([
  'relaxed',
  'balanced',
  'challenging',
  'easy',
  'medium',
  'hard',
  'adaptive',
])
const MAX_NUMBER = Number.MAX_SAFE_INTEGER

export class ProgressValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ProgressValidationError'
    this.statusCode = 400
  }
}

function isRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function invalid(label) {
  throw new ProgressValidationError(`Invalid ${label}`)
}

function boundedString(value, label, maximum = 160, { nullable = false } = {}) {
  if (nullable && value === null) {
    return null
  }

  if (typeof value !== 'string') {
    return invalid(label)
  }

  const normalized = value.trim()
  if (!normalized || normalized.length > maximum) {
    return invalid(label)
  }

  return normalized
}

function safeIdentifier(value, label, { nullable = false } = {}) {
  const identifier = boundedString(value, label, 160, { nullable })

  if (identifier === null) {
    return null
  }

  if (!SAFE_KEY_PATTERN.test(identifier)) {
    return invalid(label)
  }

  return identifier
}

function wholeNumber(value, label, minimum = 0, maximum = MAX_NUMBER) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    return invalid(label)
  }

  return value
}

function percentage(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    return invalid(label)
  }

  return value
}

function booleanValue(value, label) {
  if (typeof value !== 'boolean') {
    return invalid(label)
  }

  return value
}

function dateValue(value, label, { nullable = true } = {}) {
  if (nullable && value === null) {
    return null
  }

  const date = boundedString(value, label, 40)
  if (!Number.isFinite(Date.parse(date))) {
    return invalid(label)
  }

  return date
}

function read(input, key, current, sanitizer, strict) {
  if (!Object.hasOwn(input, key)) {
    return current
  }

  try {
    return sanitizer(input[key])
  } catch (error) {
    if (strict) {
      throw error
    }

    return current
  }
}

function stringArray(value, label, maximumItems = 1000) {
  if (!Array.isArray(value) || value.length > maximumItems) {
    return invalid(label)
  }

  return [...new Set(value.map((item, index) => safeIdentifier(item, `${label}[${index}]`)))]
}

function safeJsonValue(value, label, depth = 0) {
  if (depth > 5) {
    return invalid(label)
  }

  if (value === null || typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return invalid(label)
    }
    return value
  }

  if (typeof value === 'string') {
    if (value.length > 1000) {
      return invalid(label)
    }
    return value
  }

  if (Array.isArray(value)) {
    if (value.length > 200) {
      return invalid(label)
    }
    return value.map((item, index) => safeJsonValue(item, `${label}[${index}]`, depth + 1))
  }

  if (!isRecord(value) || Object.keys(value).length > 50) {
    return invalid(label)
  }

  const sanitized = {}
  for (const [key, nestedValue] of Object.entries(value)) {
    if (UNSAFE_KEYS.has(key) || key.length > 80 || !SAFE_KEY_PATTERN.test(key)) {
      continue
    }
    sanitized[key] = safeJsonValue(nestedValue, `${label}.${key}`, depth + 1)
  }

  return sanitized
}

function sanitizeCountPair(value, label, strict, current = { answered: 0, correct: 0 }) {
  if (!isRecord(value)) {
    return invalid(label)
  }

  const answered = read(value, 'answered', current.answered, (item) => wholeNumber(item, `${label}.answered`), strict)
  const correct = read(value, 'correct', current.correct, (item) => wholeNumber(item, `${label}.correct`), strict)

  if (correct > answered) {
    return invalid(`${label}.correct`)
  }

  return { answered, correct }
}

function sanitizeCountMap(value, label, strict) {
  if (!isRecord(value) || Object.keys(value).length > 100) {
    return invalid(label)
  }

  const result = {}
  for (const [key, entry] of Object.entries(value)) {
    if (UNSAFE_KEYS.has(key) || !SAFE_KEY_PATTERN.test(key) || key.length > 80) {
      continue
    }

    try {
      result[key] = sanitizeCountPair(entry, `${label}.${key}`, strict)
    } catch (error) {
      if (strict) {
        throw error
      }
    }
  }
  return result
}

function sanitizeStats(value, current, strict) {
  if (!isRecord(value)) {
    return invalid('stats')
  }

  const countFields = [
    'questionsAnswered',
    'correctAnswers',
    'wrongAnswers',
    'missionsCompleted',
    'bossBattlesWon',
    'perfectMissions',
    'totalPlaySessions',
    'technologiesCompleted',
  ]
  const result = { ...current }

  for (const key of countFields) {
    result[key] = read(value, key, current[key], (item) => wholeNumber(item, `stats.${key}`), strict)
  }

  result.accuracy = read(value, 'accuracy', current.accuracy, (item) => percentage(item, 'stats.accuracy'), strict)
  result.byTechnology = read(value, 'byTechnology', current.byTechnology, (item) => sanitizeCountMap(item, 'stats.byTechnology', strict), strict)
  result.byDifficulty = read(value, 'byDifficulty', current.byDifficulty, (item) => sanitizeCountMap(item, 'stats.byDifficulty', strict), strict)
  result.byQuestionType = read(value, 'byQuestionType', current.byQuestionType, (item) => sanitizeCountMap(item, 'stats.byQuestionType', strict), strict)

  if (result.correctAnswers + result.wrongAnswers > result.questionsAnswered) {
    return invalid('stats answer totals')
  }

  return result
}

function sanitizeTechnologyProgress(value, strict) {
  if (!isRecord(value) || Object.keys(value).length > 100) {
    return invalid('technologyProgress')
  }

  const result = {}
  const countFields = [
    'completedMissions',
    'totalMissions',
    'questionsAnswered',
    'correctAnswers',
    'wrongAnswers',
  ]

  for (const [technologyId, progress] of Object.entries(value)) {
    if (UNSAFE_KEYS.has(technologyId) || !SAFE_KEY_PATTERN.test(technologyId) || technologyId.length > 80) {
      continue
    }
    if (!isRecord(progress)) {
      if (strict) invalid(`technologyProgress.${technologyId}`)
      continue
    }

    const entry = {}
    try {
      for (const key of countFields) {
        if (Object.hasOwn(progress, key)) {
          entry[key] = wholeNumber(progress[key], `technologyProgress.${technologyId}.${key}`)
        }
      }
      if (Object.hasOwn(progress, 'completionPercentage')) {
        entry.completionPercentage = percentage(progress.completionPercentage, `technologyProgress.${technologyId}.completionPercentage`)
      }
      for (const key of ['bossDefeated', 'completed']) {
        if (Object.hasOwn(progress, key)) {
          entry[key] = booleanValue(progress[key], `technologyProgress.${technologyId}.${key}`)
        }
      }

      if (
        entry.correctAnswers !== undefined &&
        entry.questionsAnswered !== undefined &&
        entry.correctAnswers > entry.questionsAnswered
      ) {
        invalid(`technologyProgress.${technologyId}.correctAnswers`)
      }

      result[technologyId] = entry
    } catch (error) {
      if (strict) throw error
    }
  }

  return result
}

function sanitizeCompletedMissions(value) {
  if (!Array.isArray(value) || value.length > 1000) {
    return invalid('completedMissions')
  }

  return value.map((entry, index) => {
    if (typeof entry === 'string') {
      return safeIdentifier(entry, `completedMissions[${index}]`)
    }
    if (!isRecord(entry)) {
      return invalid(`completedMissions[${index}]`)
    }

    const mission = {
      id: safeIdentifier(entry.id, `completedMissions[${index}].id`),
      technologyId: safeIdentifier(entry.technologyId, `completedMissions[${index}].technologyId`),
      missionId: safeIdentifier(entry.missionId, `completedMissions[${index}].missionId`),
      completedAt: dateValue(entry.completedAt, `completedMissions[${index}].completedAt`, { nullable: false }),
    }

    if (Object.hasOwn(entry, 'accuracy')) {
      mission.accuracy = percentage(entry.accuracy, `completedMissions[${index}].accuracy`)
    }

    return mission
  })
}

function sanitizeAchievements(value, current, strict) {
  if (!isRecord(value)) {
    return invalid('achievements')
  }

  const unlocked = read(value, 'unlocked', current.unlocked, (items) => {
    if (!Array.isArray(items) || items.length > 500) invalid('achievements.unlocked')
    return items.map((entry, index) => {
      if (typeof entry === 'string') {
        return safeIdentifier(entry, `achievements.unlocked[${index}]`)
      }
      if (!isRecord(entry)) invalid(`achievements.unlocked[${index}]`)
      return {
        id: safeIdentifier(entry.id, `achievements.unlocked[${index}].id`),
        unlockedAt: dateValue(entry.unlockedAt, `achievements.unlocked[${index}].unlockedAt`, { nullable: false }),
      }
    })
  }, strict)

  const progress = read(value, 'progress', current.progress, (entries) => {
    if (!isRecord(entries) || Object.keys(entries).length > 500) invalid('achievements.progress')
    const result = {}
    for (const [key, entry] of Object.entries(entries)) {
      if (UNSAFE_KEYS.has(key) || !SAFE_KEY_PATTERN.test(key) || key.length > 80) continue
      if (!isRecord(entry)) invalid(`achievements.progress.${key}`)
      const currentValue = wholeNumber(entry.current, `achievements.progress.${key}.current`)
      const target = wholeNumber(entry.target, `achievements.progress.${key}.target`, 1)
      result[key] = {
        current: currentValue,
        target,
        percentage: Object.hasOwn(entry, 'percentage')
          ? percentage(entry.percentage, `achievements.progress.${key}.percentage`)
          : Math.min(100, Math.round((currentValue / target) * 100)),
      }
    }
    return result
  }, strict)

  return { unlocked, progress }
}

function sanitizeRevision(value, current, strict) {
  if (!isRecord(value)) return invalid('revision')
  return {
    markedQuestions: read(value, 'markedQuestions', current.markedQuestions, (item) => stringArray(item, 'revision.markedQuestions', 1000), strict),
    incorrectQuestions: read(value, 'incorrectQuestions', current.incorrectQuestions, (item) => stringArray(item, 'revision.incorrectQuestions', 1000), strict),
  }
}

function sanitizeDailyChallenge(value, current, strict) {
  if (!isRecord(value)) return invalid('dailyChallenge')

  const result = {
    date: read(value, 'date', current.date, (item) => dateValue(item, 'dailyChallenge.date'), strict),
    completed: read(value, 'completed', current.completed, (item) => booleanValue(item, 'dailyChallenge.completed'), strict),
    completedTasks: read(value, 'completedTasks', current.completedTasks, (item) => stringArray(item, 'dailyChallenge.completedTasks', 200), strict),
    rewardClaimed: read(value, 'rewardClaimed', current.rewardClaimed, (item) => booleanValue(item, 'dailyChallenge.rewardClaimed'), strict),
    score: read(value, 'score', current.score, (item) => wholeNumber(item, 'dailyChallenge.score'), strict),
    totalQuestions: read(value, 'totalQuestions', current.totalQuestions, (item) => wholeNumber(item, 'dailyChallenge.totalQuestions'), strict),
  }

  if (result.score > result.totalQuestions) {
    return invalid('dailyChallenge.score')
  }

  return result
}

function sanitizeInventory(value, current, strict) {
  if (!isRecord(value)) return invalid('inventory')
  const result = { ...current }
  for (const key of ['extraHearts', 'hints', 'fiftyFifty', 'skips']) {
    result[key] = read(value, key, current[key], (item) => wholeNumber(item, `inventory.${key}`), strict)
  }
  return result
}

function sanitizeSettings(value, current, strict) {
  if (!isRecord(value)) return invalid('settings')
  const result = { ...current }

  for (const key of ['soundEnabled', 'animationsEnabled', 'autoShowExplanation']) {
    result[key] = read(value, key, current[key], (item) => booleanValue(item, `settings.${key}`), strict)
  }
  result.difficultyPreference = read(value, 'difficultyPreference', current.difficultyPreference, (item) => {
    const preference = boundedString(item, 'settings.difficultyPreference', 20)
    if (!DIFFICULTY_PREFERENCES.has(preference)) invalid('settings.difficultyPreference')
    return preference
  }, strict)

  return result
}

function sanitizeActivities(value) {
  if (!Array.isArray(value) || value.length > 200) {
    return invalid('recentActivity')
  }

  return value.map((entry, index) => {
    if (!isRecord(entry)) invalid(`recentActivity[${index}]`)
    return {
      id: safeIdentifier(entry.id, `recentActivity[${index}].id`),
      type: safeIdentifier(entry.type, `recentActivity[${index}].type`),
      message: boundedString(entry.message, `recentActivity[${index}].message`, 300),
      createdAt: dateValue(entry.createdAt, `recentActivity[${index}].createdAt`, { nullable: false }),
      metadata: Object.hasOwn(entry, 'metadata')
        ? safeJsonValue(entry.metadata, `recentActivity[${index}].metadata`)
        : {},
    }
  })
}

function sanitizeSession(value, current, strict) {
  if (!isRecord(value)) return invalid('session')

  return {
    currentTechnologyId: read(value, 'currentTechnologyId', current.currentTechnologyId, (item) => safeIdentifier(item, 'session.currentTechnologyId', { nullable: true }), strict),
    currentMissionId: read(value, 'currentMissionId', current.currentMissionId, (item) => safeIdentifier(item, 'session.currentMissionId', { nullable: true }), strict),
    lastVisitedRoute: read(value, 'lastVisitedRoute', current.lastVisitedRoute, (item) => {
      const route = boundedString(item, 'session.lastVisitedRoute', 300)
      if (!route.startsWith('/')) invalid('session.lastVisitedRoute')
      return route
    }, strict),
    mode: read(value, 'mode', current.mode, (item) => safeIdentifier(item, 'session.mode', { nullable: true }), strict),
    activeRun: read(value, 'activeRun', current.activeRun ?? null, (item) => (
      item === null ? null : safeJsonValue(item, 'session.activeRun')
    ), strict),
  }
}

export function createDefaultGameData(username = 'Player', identity = {}) {
  const safeUsername = typeof username === 'string' && username.trim()
    ? username.trim().slice(0, 30)
    : 'Player'

  return {
    id: typeof identity.id === 'string' ? identity.id : null,
    username: safeUsername,
    avatar: 'default',
    createdAt: identity.createdAt instanceof Date
      ? identity.createdAt.toISOString()
      : new Date().toISOString(),
    level: 1,
    totalXP: 0,
    currentLevelXP: 0,
    coins: 100,
    hearts: 3,
    maxHearts: 3,
    rank: 'Beginner Coder',
    streak: { current: 0, longest: 0, lastActiveDate: null, activeDates: [] },
    stats: {
      questionsAnswered: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      accuracy: 0,
      missionsCompleted: 0,
      bossBattlesWon: 0,
      perfectMissions: 0,
      totalPlaySessions: 0,
      technologiesCompleted: 0,
      byTechnology: {},
      byDifficulty: {
        easy: { answered: 0, correct: 0 },
        medium: { answered: 0, correct: 0 },
        hard: { answered: 0, correct: 0 },
      },
      byQuestionType: {},
    },
    completedMissions: [],
    unlockedMissions: [],
    technologyProgress: {},
    achievements: { unlocked: [], progress: {} },
    revision: { markedQuestions: [], incorrectQuestions: [] },
    dailyChallenge: {
      date: null,
      completed: false,
      completedTasks: [],
      rewardClaimed: false,
      score: 0,
      totalQuestions: 0,
    },
    inventory: { extraHearts: 0, hints: 0, fiftyFifty: 0, skips: 0 },
    settings: {
      soundEnabled: true,
      animationsEnabled: true,
      autoShowExplanation: true,
      difficultyPreference: 'balanced',
    },
    recentActivity: [],
    session: {
      currentTechnologyId: null,
      currentMissionId: null,
      lastVisitedRoute: '/',
      mode: null,
      activeRun: null,
    },
  }
}

function applyProgress(input, current, strict) {
  if (!isRecord(input)) {
    return invalid('gameData')
  }

  const next = { ...current }
  next.username = read(input, 'username', current.username, (item) => boundedString(item, 'username', 30), strict)
  next.avatar = read(input, 'avatar', current.avatar, (item) => safeIdentifier(item, 'avatar'), strict)
  next.level = read(input, 'level', current.level, (item) => wholeNumber(item, 'level', 1, 100000), strict)
  next.totalXP = read(input, 'totalXP', current.totalXP, (item) => wholeNumber(item, 'totalXP'), strict)
  next.currentLevelXP = read(input, 'currentLevelXP', current.currentLevelXP, (item) => wholeNumber(item, 'currentLevelXP'), strict)
  next.coins = read(input, 'coins', current.coins, (item) => wholeNumber(item, 'coins'), strict)
  next.maxHearts = read(input, 'maxHearts', current.maxHearts, (item) => wholeNumber(item, 'maxHearts', 1, 999), strict)
  next.hearts = read(input, 'hearts', Math.min(current.hearts, next.maxHearts), (item) => wholeNumber(item, 'hearts', 0, next.maxHearts), strict)
  next.rank = read(input, 'rank', current.rank, (item) => boundedString(item, 'rank', 80), strict)

  next.streak = read(input, 'streak', current.streak, (value) => {
    if (!isRecord(value)) invalid('streak')
    const streak = {
      current: read(value, 'current', current.streak.current, (item) => wholeNumber(item, 'streak.current'), strict),
      longest: read(value, 'longest', current.streak.longest, (item) => wholeNumber(item, 'streak.longest'), strict),
      lastActiveDate: read(value, 'lastActiveDate', current.streak.lastActiveDate, (item) => dateValue(item, 'streak.lastActiveDate'), strict),
      activeDates: read(value, 'activeDates', current.streak.activeDates, (item) => {
        if (!Array.isArray(item) || item.length > 1000) invalid('streak.activeDates')
        return [...new Set(item.map((date, index) => dateValue(date, `streak.activeDates[${index}]`, { nullable: false })))]
      }, strict),
    }
    if (streak.longest < streak.current) streak.longest = streak.current
    return streak
  }, strict)

  next.stats = read(input, 'stats', current.stats, (item) => sanitizeStats(item, current.stats, strict), strict)
  next.completedMissions = read(input, 'completedMissions', current.completedMissions, sanitizeCompletedMissions, strict)
  next.unlockedMissions = read(input, 'unlockedMissions', current.unlockedMissions, (item) => stringArray(item, 'unlockedMissions', 1000), strict)
  next.technologyProgress = read(input, 'technologyProgress', current.technologyProgress, (item) => sanitizeTechnologyProgress(item, strict), strict)
  next.achievements = read(input, 'achievements', current.achievements, (item) => sanitizeAchievements(item, current.achievements, strict), strict)
  next.revision = read(input, 'revision', current.revision, (item) => sanitizeRevision(item, current.revision, strict), strict)
  next.dailyChallenge = read(input, 'dailyChallenge', current.dailyChallenge, (item) => sanitizeDailyChallenge(item, current.dailyChallenge, strict), strict)
  next.inventory = read(input, 'inventory', current.inventory, (item) => sanitizeInventory(item, current.inventory, strict), strict)
  next.settings = read(input, 'settings', current.settings, (item) => sanitizeSettings(item, current.settings, strict), strict)
  next.recentActivity = read(input, 'recentActivity', current.recentActivity, sanitizeActivities, strict)
  next.session = read(input, 'session', current.session, (item) => sanitizeSession(item, current.session, strict), strict)

  // Identity and creation time are always server-owned, even when clients send
  // the complete local player object during migration.
  next.id = current.id
  next.createdAt = current.createdAt

  return next
}

export function normalizeGameData(storedGameData, identity = {}) {
  const defaults = createDefaultGameData(identity.username, identity)
  return isRecord(storedGameData)
    ? applyProgress(storedGameData, defaults, false)
    : defaults
}

export function sanitizeProgressUpdate(progress, storedGameData, identity = {}) {
  const current = normalizeGameData(storedGameData, identity)
  return applyProgress(progress, current, true)
}

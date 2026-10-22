import { createDefaultPlayer, sanitizeUsername } from '../data/player.js'
import { getLevelSummary } from '../utils/levels.js'

export const CODEQUEST_PLAYER_KEY = 'codequest_player'
export const CODEQUEST_PLAYER_CACHE_PREFIX = 'codequest_player_cache:'
export const CODEQUEST_MIGRATION_PREFIX = 'codequest_progress_migration:'
export const STORAGE_VERSION = 2

const MIGRATION_DECISIONS = new Set(['use-local', 'start-fresh'])

const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function isRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  try {
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
  } catch {
    return false
  }
}

function getStorage() {
  try {
    if (typeof globalThis === 'undefined') {
      return null
    }

    const storage = globalThis.localStorage

    if (
      !storage ||
      typeof storage.getItem !== 'function' ||
      typeof storage.setItem !== 'function' ||
      typeof storage.removeItem !== 'function'
    ) {
      return null
    }

    return storage
  } catch {
    return null
  }
}

function normalizeStorageIdentifier(identifier) {
  if (typeof identifier !== 'string') {
    return null
  }

  const normalized = identifier.trim()
  return normalized ? encodeURIComponent(normalized) : null
}

function getPlayerStorageKey(identifier) {
  const normalizedIdentifier = normalizeStorageIdentifier(identifier)
  return normalizedIdentifier
    ? `${CODEQUEST_PLAYER_CACHE_PREFIX}${normalizedIdentifier}`
    : CODEQUEST_PLAYER_KEY
}

function getMigrationStorageKey(identifier) {
  const normalizedIdentifier = normalizeStorageIdentifier(identifier)
  return normalizedIdentifier
    ? `${CODEQUEST_MIGRATION_PREFIX}${normalizedIdentifier}`
    : null
}

function cloneStoredValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneStoredValue)
  }

  if (isRecord(value)) {
    const clone = {}

    Object.entries(value).forEach(([key, nestedValue]) => {
      if (!UNSAFE_OBJECT_KEYS.has(key)) {
        clone[key] = cloneStoredValue(nestedValue)
      }
    })

    return clone
  }

  return value
}

function mergeWithDefaultShape(defaultValue, savedValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(savedValue)
      ? savedValue.map(cloneStoredValue)
      : defaultValue.map(cloneStoredValue)
  }

  if (isRecord(defaultValue)) {
    const savedRecord = isRecord(savedValue) ? savedValue : {}
    const merged = cloneStoredValue(savedRecord)

    Object.entries(defaultValue).forEach(([key, nestedDefault]) => {
      if (UNSAFE_OBJECT_KEYS.has(key)) {
        return
      }

      merged[key] = mergeWithDefaultShape(nestedDefault, savedRecord[key])
    })

    return merged
  }

  if (savedValue === undefined) {
    return defaultValue
  }

  if (defaultValue === null) {
    return savedValue === null || ['string', 'number', 'boolean'].includes(typeof savedValue)
      ? savedValue
      : defaultValue
  }

  return typeof savedValue === typeof defaultValue ? savedValue : defaultValue
}

function sanitizeWholeNumber(value, fallback, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(maximum, Math.max(minimum, Math.floor(value)))
}

function sanitizeNumber(value, fallback, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(maximum, Math.max(minimum, value))
}

function isIsoDateString(value) {
  if (typeof value !== 'string') {
    return false
  }

  try {
    return new Date(value).toISOString() === value
  } catch {
    return false
  }
}

function sanitizeCoreNumbers(player, defaults) {
  player.level = sanitizeWholeNumber(player.level, defaults.level, 1)
  player.totalXP = sanitizeWholeNumber(player.totalXP, defaults.totalXP)
  player.currentLevelXP = sanitizeWholeNumber(
    player.currentLevelXP,
    defaults.currentLevelXP,
  )
  player.coins = sanitizeWholeNumber(player.coins, defaults.coins)
  player.maxHearts = sanitizeWholeNumber(player.maxHearts, defaults.maxHearts, 1)
  player.hearts = sanitizeWholeNumber(
    player.hearts,
    Math.min(defaults.hearts, player.maxHearts),
    0,
    player.maxHearts,
  )

  player.streak.current = sanitizeWholeNumber(
    player.streak.current,
    defaults.streak.current,
  )
  player.streak.longest = sanitizeWholeNumber(
    player.streak.longest,
    defaults.streak.longest,
  )

  const wholeNumberStats = [
    'questionsAnswered',
    'correctAnswers',
    'wrongAnswers',
    'missionsCompleted',
    'bossBattlesWon',
    'perfectMissions',
    'totalPlaySessions',
    'technologiesCompleted',
  ]

  wholeNumberStats.forEach((key) => {
    player.stats[key] = sanitizeWholeNumber(player.stats[key], defaults.stats[key])
  })

  player.stats.accuracy = sanitizeNumber(
    player.stats.accuracy,
    defaults.stats.accuracy,
    0,
    100,
  )

  const progression = getLevelSummary(player.totalXP)
  player.level = progression.level
  player.currentLevelXP = progression.currentLevelXP
  player.rank = progression.rank

  player.dailyChallenge.score = sanitizeWholeNumber(
    player.dailyChallenge.score,
    defaults.dailyChallenge.score,
  )
  player.dailyChallenge.totalQuestions = sanitizeWholeNumber(
    player.dailyChallenge.totalQuestions,
    defaults.dailyChallenge.totalQuestions,
  )

  Object.keys(defaults.inventory).forEach((key) => {
    player.inventory[key] = sanitizeWholeNumber(
      player.inventory[key],
      defaults.inventory[key],
    )
  })

  return player
}

function isLikelyLegacyPlayer(value) {
  if (!isRecord(value)) {
    return false
  }

  return [
    'id',
    'username',
    'createdAt',
    'level',
    'totalXP',
    'coins',
    'stats',
    'technologyProgress',
  ].some((key) => Object.hasOwn(value, key))
}

function getStoredPlayer(parsedValue) {
  if (!isRecord(parsedValue)) {
    return null
  }

  // Versioned saves remain forward-tolerant: an unfamiliar version can still
  // contribute recognizable player fields, which are merged into today's model.
  if (Object.hasOwn(parsedValue, 'player')) {
    const hasValidVersion =
      Number.isSafeInteger(parsedValue.version) && parsedValue.version >= 0

    return hasValidVersion && isRecord(parsedValue.player)
      ? parsedValue.player
      : null
  }

  return isLikelyLegacyPlayer(parsedValue) ? parsedValue : null
}

export function mergePlayerWithDefaults(savedPlayer) {
  const defaults = createDefaultPlayer()

  if (!isRecord(savedPlayer)) {
    return defaults
  }

  const mergedPlayer = mergeWithDefaultShape(defaults, savedPlayer)

  mergedPlayer.id =
    typeof savedPlayer.id === 'string' && savedPlayer.id.trim()
      ? savedPlayer.id
      : defaults.id
  mergedPlayer.createdAt =
    isIsoDateString(savedPlayer.createdAt)
      ? savedPlayer.createdAt
      : defaults.createdAt
  mergedPlayer.username = sanitizeUsername(savedPlayer.username)

  return sanitizeCoreNumbers(mergedPlayer, defaults)
}

export function savePlayer(player, identifier = null) {
  if (!isLikelyLegacyPlayer(player)) {
    return false
  }

  const storage = getStorage()

  if (!storage) {
    return false
  }

  try {
    const serializedPlayer = JSON.stringify({
      version: STORAGE_VERSION,
      player,
    })

    if (typeof serializedPlayer !== 'string') {
      return false
    }

    const serializedValue = JSON.parse(serializedPlayer)

    if (!isRecord(serializedValue) || !isRecord(serializedValue.player)) {
      return false
    }

    storage.setItem(getPlayerStorageKey(identifier), serializedPlayer)
    return true
  } catch {
    return false
  }
}

export function loadPlayer(identifier = null) {
  const storage = getStorage()

  if (!storage) {
    return null
  }

  try {
    const serializedPlayer = storage.getItem(getPlayerStorageKey(identifier))

    if (typeof serializedPlayer !== 'string' || serializedPlayer.length === 0) {
      return null
    }

    const parsedValue = JSON.parse(serializedPlayer)
    const storedPlayer = getStoredPlayer(parsedValue)

    return storedPlayer ? mergePlayerWithDefaults(storedPlayer) : null
  } catch {
    return null
  }
}

export function clearPlayerStorage(identifier = null) {
  const storage = getStorage()

  if (!storage) {
    return false
  }

  try {
    storage.removeItem(getPlayerStorageKey(identifier))
    return true
  } catch {
    return false
  }
}

export function loadLegacyPlayer() {
  return loadPlayer()
}

export function hasLegacyPlayerProgress() {
  const player = loadLegacyPlayer()

  if (!player) {
    return false
  }

  const defaults = createDefaultPlayer()
  const hasChangedSettings = Object.keys(defaults.settings).some(
    (key) => player.settings?.[key] !== defaults.settings[key],
  )

  return Boolean(
    player.totalXP > 0
      || player.coins !== defaults.coins
      || player.stats?.questionsAnswered > 0
      || player.stats?.missionsCompleted > 0
      || player.stats?.bossBattlesWon > 0
      || player.completedMissions?.length > 0
      || player.achievements?.unlocked?.length > 0
      || player.revision?.markedQuestions?.length > 0
      || player.revision?.incorrectQuestions?.length > 0
      || player.dailyChallenge?.completed
      || player.recentActivity?.length > 0
      || player.session?.activeRun
      || player.username !== defaults.username
      || hasChangedSettings
  )
}

export function getProgressMigrationDecision(identifier) {
  const storage = getStorage()
  const key = getMigrationStorageKey(identifier)

  if (!storage || !key) {
    return null
  }

  try {
    const decision = storage.getItem(key)
    return MIGRATION_DECISIONS.has(decision) ? decision : null
  } catch {
    return null
  }
}

export function saveProgressMigrationDecision(identifier, decision) {
  const storage = getStorage()
  const key = getMigrationStorageKey(identifier)

  if (!storage || !key || !MIGRATION_DECISIONS.has(decision)) {
    return false
  }

  try {
    storage.setItem(key, decision)
    return true
  } catch {
    return false
  }
}

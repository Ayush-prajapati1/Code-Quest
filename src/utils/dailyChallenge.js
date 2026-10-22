import { toDateKey } from './streak.js'

export const DEFAULT_DAILY_TASKS = Object.freeze([
  Object.freeze({ technologyId: 'dsa', count: 2 }),
  Object.freeze({ technologyId: 'sql', count: 1 }),
  Object.freeze({ technologyId: 'react', count: 1 }),
])

export const DEFAULT_DAILY_REWARD = Object.freeze({ xp: 500, coins: 100 })

function hashText(value) {
  let hash = 2_166_136_261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }

  return hash >>> 0
}

function createSeededRandom(seed) {
  let state = seed || 1

  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function getStableItemKey(item, index) {
  if (item !== null && typeof item === 'object') {
    const identifier = item.id ?? item.questionId ?? item.name

    if (identifier !== undefined && identifier !== null) {
      return String(identifier)
    }
  }

  return `${typeof item}:${String(item)}:${index}`
}

export function createDailySeed(date, salt = 'codequest') {
  const dateKey = toDateKey(date)

  return dateKey ? hashText(`${salt}:${dateKey}`) : 0
}

export function selectDeterministicItems(items, count, seedInput) {
  if (!Array.isArray(items) || items.length === 0) {
    return []
  }

  const normalizedCount =
    typeof count === 'number' && Number.isFinite(count)
      ? Math.max(0, Math.floor(count))
      : 0
  const seed =
    typeof seedInput === 'number' && Number.isFinite(seedInput)
      ? Math.floor(seedInput) >>> 0
      : hashText(String(seedInput ?? 'codequest'))
  const random = createSeededRandom(seed)
  const sortedItems = items
    .map((item, index) => ({ item, key: getStableItemKey(item, index) }))
    .sort((left, right) => left.key.localeCompare(right.key))

  for (let index = sortedItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const currentItem = sortedItems[index]
    sortedItems[index] = sortedItems[swapIndex]
    sortedItems[swapIndex] = currentItem
  }

  return sortedItems
    .slice(0, Math.min(normalizedCount, sortedItems.length))
    .map(({ item }) => item)
}

function getTechnologyId(question) {
  if (question === null || typeof question !== 'object') {
    return ''
  }

  return String(question.technologyId ?? question.technology ?? '').toLowerCase()
}

function toRewardAmount(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback
}

function normalizeTasks(tasks) {
  const sourceTasks = Array.isArray(tasks) ? tasks : DEFAULT_DAILY_TASKS

  return sourceTasks
    .filter((task) => task !== null && typeof task === 'object')
    .map((task) => ({
      technologyId: String(task.technologyId ?? task.technology ?? '')
        .trim()
        .toLowerCase(),
      count:
        typeof task.count === 'number' && Number.isFinite(task.count)
          ? Math.max(0, Math.floor(task.count))
          : 0,
    }))
    .filter((task) => task.technologyId && task.count > 0)
}

export function selectDailyQuestions(
  questions,
  date,
  tasks = DEFAULT_DAILY_TASKS,
) {
  const dateKey = toDateKey(date)

  if (!dateKey || !Array.isArray(questions)) {
    return []
  }

  const usedQuestionIds = new Set()
  const selectedQuestions = []

  normalizeTasks(tasks).forEach((task) => {
    const candidates = questions.filter((question, index) => {
      const questionId = getStableItemKey(question, index)

      return (
        getTechnologyId(question) === task.technologyId &&
        !usedQuestionIds.has(questionId)
      )
    })
    const selected = selectDeterministicItems(
      candidates,
      task.count,
      `${dateKey}:${task.technologyId}`,
    )

    selected.forEach((question, index) => {
      usedQuestionIds.add(getStableItemKey(question, index))
      selectedQuestions.push(question)
    })
  })

  return selectedQuestions
}

export function createDailyChallenge({
  date,
  questions = [],
  tasks = DEFAULT_DAILY_TASKS,
  reward = DEFAULT_DAILY_REWARD,
} = {}) {
  const dateKey = toDateKey(date)

  if (!dateKey) {
    return null
  }

  const normalizedTasks = normalizeTasks(tasks)
  const selectedQuestions = selectDailyQuestions(
    questions,
    dateKey,
    normalizedTasks,
  )

  return {
    id: `daily-${dateKey}`,
    date: dateKey,
    tasks: normalizedTasks,
    questionIds: selectedQuestions
      .map((question, index) => getStableItemKey(question, index))
      .filter(Boolean),
    questions: selectedQuestions,
    reward: {
      xp: toRewardAmount(reward?.xp, DEFAULT_DAILY_REWARD.xp),
      coins: toRewardAmount(
        reward?.coins,
        DEFAULT_DAILY_REWARD.coins,
      ),
    },
  }
}

export function isDailyChallengeForDate(dailyChallenge, date) {
  return (
    dailyChallenge !== null &&
    typeof dailyChallenge === 'object' &&
    toDateKey(dailyChallenge.date) === toDateKey(date)
  )
}

export function canClaimDailyReward(dailyChallenge, date) {
  return Boolean(
    isDailyChallengeForDate(dailyChallenge, date) &&
      dailyChallenge.completed &&
      !dailyChallenge.rewardClaimed,
  )
}

export function claimDailyReward(
  dailyChallenge,
  date,
  reward,
) {
  if (!canClaimDailyReward(dailyChallenge, date)) {
    return {
      claimed: false,
      dailyChallenge,
      reward: { xp: 0, coins: 0 },
    }
  }

  const rewardSource = reward ?? dailyChallenge.reward ?? DEFAULT_DAILY_REWARD

  return {
    claimed: true,
    dailyChallenge: {
      ...dailyChallenge,
      rewardClaimed: true,
    },
    reward: {
      xp: toRewardAmount(rewardSource?.xp, DEFAULT_DAILY_REWARD.xp),
      coins: toRewardAmount(
        rewardSource?.coins,
        DEFAULT_DAILY_REWARD.coins,
      ),
    },
  }
}

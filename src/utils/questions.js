function hash(value) {
  let result = 2_166_136_261

  for (const character of String(value)) {
    result ^= character.charCodeAt(0)
    result = Math.imul(result, 16_777_619)
  }

  return result >>> 0
}

function seededOrder(items, seed) {
  const ordered = [...items]
  let state = hash(seed) || 1

  for (let index = ordered.length - 1; index > 0; index -= 1) {
    state = Math.imul(state ^ (state >>> 15), state | 1) >>> 0
    const target = state % (index + 1)
    ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
  }

  return ordered
}

export function getCorrectAnswer(question) {
  if (!question) {
    return null
  }

  return typeof question.correctAnswer === 'number'
    ? question.options?.[question.correctAnswer] ?? null
    : question.correctAnswer
}

export function isAnswerCorrect(question, answer) {
  return answer != null && answer === getCorrectAnswer(question)
}

export function selectMissionQuestions(questionBank, mission) {
  if (!Array.isArray(questionBank) || !mission) {
    return []
  }

  const count = Math.max(1, Math.floor(mission.requiredQuestions ?? 5))
  const topicWords = String(mission.topic ?? '')
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3)
  const matching = questionBank.filter((question) => {
    const topic = String(question.topic ?? '').toLowerCase()
    return topicWords.some((word) => topic.includes(word))
  })
  const preferredIds = new Set(matching.map((question) => question.id))
  const pool = [
    ...seededOrder(matching, `${mission.id}:topic`),
    ...seededOrder(
      questionBank.filter((question) => !preferredIds.has(question.id)),
      `${mission.id}:fallback`,
    ),
  ]

  return pool.slice(0, Math.min(count, pool.length))
}

export function selectBossQuestions(questionBank, boss) {
  const hard = questionBank.filter((question) =>
    ['medium', 'hard'].includes(String(question.difficulty).toLowerCase()),
  )
  const pool = hard.length >= 5 ? hard : questionBank

  return seededOrder(pool, `${boss?.id ?? 'boss'}:battle`).slice(0, 8)
}

export function getQuestionsFromIds(allQuestions, ids) {
  const map = new Map(allQuestions.map((question) => [question.id, question]))

  return (Array.isArray(ids) ? ids : []).map((id) => map.get(id)).filter(Boolean)
}

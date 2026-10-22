const rewardsByDifficulty = {
  Easy: { xp: 10, coins: 2 },
  Medium: { xp: 18, coins: 4 },
  Hard: { xp: 28, coins: 6 },
}

export function createQuestionBank(technology, questions) {
  return questions.map((question, index) => {
    const rewards = rewardsByDifficulty[question.difficulty] ?? rewardsByDifficulty.Medium

    return {
      id: `${technology}-q${String(index + 1).padStart(3, '0')}`,
      technology,
      topic: question.topic,
      difficulty: question.difficulty,
      type: question.type,
      question: question.question,
      code: question.code ?? '',
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      hint: question.hint,
      xp: question.xp ?? rewards.xp,
      coins: question.coins ?? rewards.coins,
    }
  })
}

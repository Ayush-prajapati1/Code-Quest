const DEFAULT_USERNAME = 'Player'
const MAX_USERNAME_LENGTH = 30

export function sanitizeUsername(username) {
  let normalizedUsername = ''

  try {
    normalizedUsername = username == null ? '' : String(username)
  } catch {
    return DEFAULT_USERNAME
  }

  const trimmedUsername = normalizedUsername.trim().slice(0, MAX_USERNAME_LENGTH)

  return trimmedUsername || DEFAULT_USERNAME
}

function generatePlayerId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `player-${globalThis.crypto.randomUUID()}`
  }

  const timestamp = Date.now().toString(36)
  const randomValue = Math.random().toString(36).slice(2, 10)

  return `player-${timestamp}-${randomValue}`
}

export function createDefaultPlayer(username = DEFAULT_USERNAME) {
  return {
    id: generatePlayerId(),
    username: sanitizeUsername(username),
    avatar: 'default',
    createdAt: new Date().toISOString(),

    level: 1,
    totalXP: 0,
    currentLevelXP: 0,
    coins: 100,
    hearts: 3,
    maxHearts: 3,
    rank: 'Beginner Coder',

    streak: {
      current: 0,
      longest: 0,
      lastActiveDate: null,
      activeDates: [],
    },

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
    },

    completedMissions: [],
    unlockedMissions: [],
    technologyProgress: {},

    achievements: {
      unlocked: [],
      progress: {},
    },

    revision: {
      markedQuestions: [],
      incorrectQuestions: [],
    },

    dailyChallenge: {
      date: null,
      completed: false,
      completedTasks: [],
      rewardClaimed: false,
      score: 0,
      totalQuestions: 0,
    },

    inventory: {
      extraHearts: 0,
      hints: 0,
      fiftyFifty: 0,
      skips: 0,
    },

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
    },
  }
}

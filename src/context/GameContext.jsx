import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { achievementDefinitions } from '../data/achievements.js'
import { missions } from '../data/missions.js'
import { createDefaultPlayer, sanitizeUsername } from '../data/player.js'
import Modal from '../components/common/Modal.jsx'
import { useAuth } from './AuthContext.jsx'
import { getPlayerProgress, savePlayerProgress } from '../services/api.js'
import {
  clearPlayerStorage,
  getProgressMigrationDecision,
  hasLegacyPlayerProgress,
  loadLegacyPlayer,
  loadPlayer,
  mergePlayerWithDefaults,
  savePlayer,
  saveProgressMigrationDecision,
} from '../services/storage.js'
import { appendRecentActivity, ACTIVITY_TYPES } from '../utils/activity.js'
import { spendCoins as calculateCoinSpend } from '../utils/coins.js'
import { getMissionKey, getNextMission, getTechnologyMissions } from '../utils/gameProgress.js'
import { applyRewardToPlayer } from '../utils/rewards.js'
import { updateStreak } from '../utils/streak.js'

const GameContext = createContext(null)

function wholeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0
}

function unique(items) {
  return [...new Set(Array.isArray(items) ? items.filter(Boolean) : [])]
}

function getUnlockedIds(player) {
  return new Set(
    (player.achievements?.unlocked ?? []).map((item) =>
      typeof item === 'string' ? item : item?.id,
    ),
  )
}

function getConditionProgress(player, condition = {}) {
  switch (condition.type) {
    case 'correctAnswers':
    case 'questionsAnswered':
    case 'missionsCompleted':
    case 'bossBattlesWon':
    case 'perfectMissions':
      return wholeNumber(player.stats?.[condition.type])
    case 'currentStreak':
      return wholeNumber(player.streak?.current)
    case 'questionTypeCorrect':
      return wholeNumber(player.stats?.byQuestionType?.[condition.questionType]?.correct)
    case 'technologyBossDefeated':
      return player.technologyProgress?.[condition.technologyId]?.bossDefeated ? 1 : 0
    default:
      return 0
  }
}

function addActivity(player, type, message, metadata = {}) {
  const createdAt = new Date().toISOString()

  return {
    ...player,
    recentActivity: appendRecentActivity(player.recentActivity, {
      id: `${type}-${createdAt}-${metadata.id ?? ''}`,
      type,
      message,
      createdAt,
      metadata,
    }),
  }
}

function award(player, reward) {
  const { player: rewardedPlayer, outcome } = applyRewardToPlayer(player, reward)

  if (!outcome?.xp.leveledUp) {
    return rewardedPlayer
  }

  return addActivity(
    rewardedPlayer,
    ACTIVITY_TYPES.LEVEL_UP,
    `Reached level ${outcome.xp.level} — ${outcome.nextRank}`,
    { level: outcome.xp.level },
  )
}

function applyAchievementChecks(player) {
  const unlockedIds = getUnlockedIds(player)
  const progress = {}
  const newlyUnlocked = []

  achievementDefinitions.forEach((achievement) => {
    const target = Math.max(1, wholeNumber(achievement.condition?.target) || 1)
    const current = getConditionProgress(player, achievement.condition)
    progress[achievement.id] = {
      current,
      target,
      percentage: Math.min(100, Math.round((current / target) * 100)),
    }

    if (current >= target && !unlockedIds.has(achievement.id)) {
      newlyUnlocked.push(achievement)
    }
  })

  if (newlyUnlocked.length === 0) {
    return {
      ...player,
      achievements: { ...player.achievements, progress },
    }
  }

  const unlockedAt = new Date().toISOString()
  let nextPlayer = {
    ...player,
    achievements: {
      ...player.achievements,
      progress,
      unlocked: [
        ...(player.achievements?.unlocked ?? []),
        ...newlyUnlocked.map((achievement) => ({
          id: achievement.id,
          unlockedAt,
        })),
      ],
    },
  }

  newlyUnlocked.forEach((achievement) => {
    nextPlayer = award(nextPlayer, {
      xp: achievement.rewardXP,
      coins: achievement.rewardCoins,
    })
    nextPlayer = addActivity(
      nextPlayer,
      ACTIVITY_TYPES.ACHIEVEMENT_UNLOCKED,
      `Achievement unlocked: ${achievement.name}`,
      { id: achievement.id },
    )
  })

  return nextPlayer
}

function finalize(player) {
  return applyAchievementChecks(player)
}

function getUserStorageIdentifier(user) {
  const identifier = user?.id ?? user?._id ?? user?.email
  return identifier == null ? null : String(identifier)
}

function normalizeCloudPlayer(cloudPlayer, user) {
  const candidate = cloudPlayer?.gameData
    ?? cloudPlayer?.progress
    ?? cloudPlayer?.data
    ?? cloudPlayer
  const mergedPlayer = mergePlayerWithDefaults(candidate)

  if (
    (!candidate?.username || candidate.username === 'Player')
    && user?.name
  ) {
    mergedPlayer.username = sanitizeUsername(user.name)
  }

  return finalize(mergedPlayer)
}

export function GameProvider({ children }) {
  const { isAuthenticated, loading: authLoading, logout, token, user } = useAuth()
  const userStorageIdentifier = getUserStorageIdentifier(user)
  const [player, setPlayer] = useState(() => finalize(loadPlayer() ?? createDefaultPlayer()))
  const [levelUpNotification, setLevelUpNotification] = useState(null)
  const [cloudLoadingState, setCloudLoadingState] = useState(true)
  const [saveStatus, setSaveStatus] = useState('idle')
  const [cloudError, setCloudError] = useState('')
  const [cloudWriteEnabled, setCloudWriteEnabled] = useState(false)
  const [hydratedUserIdentifier, setHydratedUserIdentifier] = useState(null)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [legacyMigrationPlayer, setLegacyMigrationPlayer] = useState(null)
  const [migrationSource, setMigrationSource] = useState(null)
  const [migrationError, setMigrationError] = useState('')
  const [migrationSaving, setMigrationSaving] = useState(false)
  const previousLevel = useRef(player.level)
  const playerRef = useRef(player)
  const hydratedUserRef = useRef(null)
  const loadRequestRef = useRef(0)
  const saveRequestRef = useRef(0)
  const saveQueueRef = useRef(Promise.resolve())
  const saveTimerRef = useRef(null)
  const pendingImmediateSaveRef = useRef(false)
  const migrationPendingRef = useRef(false)
  const wasAuthenticatedRef = useRef(false)
  const allowLegacySaveRef = useRef(true)

  const cloudLoading = authLoading || Boolean(
    isAuthenticated
      && (
        cloudLoadingState
        || !userStorageIdentifier
        || hydratedUserIdentifier !== userStorageIdentifier
      ),
  ) || Boolean(!isAuthenticated && hydratedUserIdentifier)

  const saveProgress = useCallback(async (playerOverride) => {
    if (
      !isAuthenticated
      || !token
      || !userStorageIdentifier
      || !cloudWriteEnabled
      || hydratedUserRef.current !== userStorageIdentifier
      || migrationPendingRef.current
    ) {
      return false
    }

    const snapshot = playerOverride ?? playerRef.current
    const requestId = saveRequestRef.current + 1
    saveRequestRef.current = requestId
    savePlayer(snapshot, userStorageIdentifier)
    setSaveStatus('saving')

    const queuedSave = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        if (
          hydratedUserRef.current !== userStorageIdentifier
          || !token
        ) {
          return false
        }

        try {
          const savedPlayer = await savePlayerProgress(token, snapshot)
          savePlayer(normalizeCloudPlayer(savedPlayer, user), userStorageIdentifier)

          if (
            saveRequestRef.current === requestId
            && hydratedUserRef.current === userStorageIdentifier
          ) {
            setSaveStatus('saved')
            setCloudError('')
          }

          return true
        } catch (error) {
          if (
            saveRequestRef.current === requestId
            && hydratedUserRef.current === userStorageIdentifier
          ) {
            setSaveStatus('offline')
            setCloudError(error?.message || 'Cloud save is temporarily unavailable.')
          }

          return false
        }
      })

    saveQueueRef.current = queuedSave.then(() => undefined)
    return queuedSave
  }, [cloudWriteEnabled, isAuthenticated, token, user, userStorageIdentifier])

  useEffect(() => {
    playerRef.current = player
  }, [player])

  useEffect(() => {
    if (authLoading) {
      return undefined
    }

    if (!isAuthenticated || !token || !userStorageIdentifier) {
      loadRequestRef.current += 1
      saveRequestRef.current += 1
      hydratedUserRef.current = null
      // This effect intentionally resets game state when the external auth
      // session ends so a signed-out screen can never retain another user.
      // oxlint-disable-next-line react/set-state-in-effect
      setHydratedUserIdentifier(null)
      migrationPendingRef.current = false
      pendingImmediateSaveRef.current = false
      setLegacyMigrationPlayer(null)
      setMigrationSource(null)
      setMigrationError('')
      setMigrationSaving(false)
      setCloudLoadingState(false)
      setCloudError('')
      setCloudWriteEnabled(false)
      setSaveStatus('idle')

      if (saveTimerRef.current) {
        globalThis.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }

      if (wasAuthenticatedRef.current) {
        const signedOutPlayer = finalize(createDefaultPlayer())
        playerRef.current = signedOutPlayer
        previousLevel.current = signedOutPlayer.level
        setLevelUpNotification(null)
        setPlayer(signedOutPlayer)
      }

      wasAuthenticatedRef.current = false
      return undefined
    }

    wasAuthenticatedRef.current = true
    allowLegacySaveRef.current = false
    const requestId = loadRequestRef.current + 1
    const controller = new AbortController()
    loadRequestRef.current = requestId
    saveRequestRef.current += 1
    hydratedUserRef.current = null
    setHydratedUserIdentifier(null)
    migrationPendingRef.current = false
    setLegacyMigrationPlayer(null)
    setMigrationSource(null)
    setMigrationError('')
    setMigrationSaving(false)
    setCloudLoadingState(true)
    setCloudError('')
    setCloudWriteEnabled(false)
    setSaveStatus('loading')

    const loadCloudProgress = async () => {
      const cachedPlayer = loadPlayer(userStorageIdentifier)
      let nextPlayer
      let nextSaveStatus = 'saved'
      let cloudLoadedSuccessfully = false
      let loadErrorMessage = ''

      try {
        const cloudPlayer = await getPlayerProgress(token, { signal: controller.signal })
        nextPlayer = normalizeCloudPlayer(cloudPlayer, user)
        cloudLoadedSuccessfully = true
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        if (error?.status === 401) {
          logout()
          return
        }

        nextPlayer = finalize(
          cachedPlayer ?? createDefaultPlayer(user?.name),
        )
        nextSaveStatus = cachedPlayer ? 'offline' : 'error'
        loadErrorMessage = cachedPlayer
          ? 'Cloud progress is unavailable. You can keep playing from this device, but changes will stay cached until you reconnect.'
          : (error?.message || 'Unable to load your cloud progress.')
      }

      if (loadRequestRef.current !== requestId) {
        return
      }

      const legacyPlayer = hasLegacyPlayerProgress() ? loadLegacyPlayer() : null
      const canMigrateLegacy = Boolean(
        cloudLoadedSuccessfully
          && legacyPlayer
          && !getProgressMigrationDecision(userStorageIdentifier),
      )
      const normalizedCachedPlayer = cachedPlayer
        ? normalizeCloudPlayer(cachedPlayer, user)
        : null
      const hasCachedConflict = Boolean(
        cloudLoadedSuccessfully
          && normalizedCachedPlayer
          && JSON.stringify(normalizedCachedPlayer) !== JSON.stringify(nextPlayer),
      )
      const migrationPlayer = canMigrateLegacy
        ? legacyPlayer
        : (hasCachedConflict ? normalizedCachedPlayer : null)
      const nextMigrationSource = canMigrateLegacy
        ? 'legacy'
        : (hasCachedConflict ? 'cache' : null)
      const shouldOfferMigration = Boolean(migrationPlayer)

      if (cloudLoadedSuccessfully && !shouldOfferMigration) {
        savePlayer(nextPlayer, userStorageIdentifier)
      }

      migrationPendingRef.current = shouldOfferMigration
      hydratedUserRef.current = userStorageIdentifier
      setHydratedUserIdentifier(userStorageIdentifier)
      playerRef.current = nextPlayer
      previousLevel.current = nextPlayer.level
      setLevelUpNotification(null)
      setPlayer(nextPlayer)
      setSaveStatus(nextSaveStatus)
      setCloudError(loadErrorMessage)
      setCloudWriteEnabled(cloudLoadedSuccessfully)
      setLegacyMigrationPlayer(migrationPlayer)
      setMigrationSource(nextMigrationSource)
      setCloudLoadingState(false)
    }

    void loadCloudProgress()

    return () => controller.abort()
  }, [authLoading, isAuthenticated, logout, reloadVersion, token, user, userStorageIdentifier])

  useEffect(() => {
    if (authLoading) {
      return undefined
    }

    if (!isAuthenticated) {
      if (allowLegacySaveRef.current) {
        savePlayer(player)
      }
      return undefined
    }

    if (
      !userStorageIdentifier
      || hydratedUserRef.current !== userStorageIdentifier
      || migrationPendingRef.current
    ) {
      return undefined
    }

    savePlayer(player, userStorageIdentifier)

    if (!cloudWriteEnabled) {
      return undefined
    }

    if (saveTimerRef.current) {
      globalThis.clearTimeout(saveTimerRef.current)
    }

    if (pendingImmediateSaveRef.current) {
      pendingImmediateSaveRef.current = false
      void saveProgress(player)
      return undefined
    }

    saveTimerRef.current = globalThis.setTimeout(() => {
      saveTimerRef.current = null
      void saveProgress(player)
    }, 1400)

    return () => {
      if (saveTimerRef.current) {
        globalThis.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [authLoading, cloudWriteEnabled, isAuthenticated, player, saveProgress, userStorageIdentifier])

  useEffect(() => {
    if (player.level > previousLevel.current) {
      setLevelUpNotification({
        level: player.level,
        rank: player.rank,
        totalXP: player.totalXP,
      })
    }

    previousLevel.current = player.level
  }, [player.level, player.rank, player.totalXP])

  const importLocalProgress = useCallback(async () => {
    if (
      !legacyMigrationPlayer
      || !token
      || !userStorageIdentifier
      || hydratedUserRef.current !== userStorageIdentifier
    ) {
      return false
    }

    const migratedPlayer = finalize(mergePlayerWithDefaults({
      ...legacyMigrationPlayer,
      id: playerRef.current.id,
      createdAt: playerRef.current.createdAt,
    }))
    setMigrationSaving(true)
    setMigrationError('')
    setSaveStatus('saving')

    try {
      const savedPlayer = normalizeCloudPlayer(
        await savePlayerProgress(token, migratedPlayer),
        user,
      )

      if (hydratedUserRef.current !== userStorageIdentifier) {
        return false
      }

      savePlayer(savedPlayer, userStorageIdentifier)
      if (migrationSource === 'legacy') {
        saveProgressMigrationDecision(userStorageIdentifier, 'use-local')
        clearPlayerStorage()
      }
      migrationPendingRef.current = false
      playerRef.current = savedPlayer
      previousLevel.current = savedPlayer.level
      setPlayer(savedPlayer)
      setLegacyMigrationPlayer(null)
      setMigrationSource(null)
      setSaveStatus('saved')
      setCloudError('')
      return true
    } catch (error) {
      setMigrationError(error?.message || 'Local progress could not be uploaded. Check the server connection and try again.')
      setSaveStatus('offline')
      return false
    } finally {
      setMigrationSaving(false)
    }
  }, [legacyMigrationPlayer, migrationSource, token, user, userStorageIdentifier])

  const keepCloudProgress = useCallback(() => {
    if (!userStorageIdentifier) {
      return
    }

    savePlayer(playerRef.current, userStorageIdentifier)
    if (migrationSource === 'legacy') {
      saveProgressMigrationDecision(userStorageIdentifier, 'start-fresh')
      clearPlayerStorage()
    }
    migrationPendingRef.current = false
    setMigrationError('')
    setLegacyMigrationPlayer(null)
    setMigrationSource(null)
  }, [migrationSource, userStorageIdentifier])

  const updatePlayer = useCallback((updates) => {
    setPlayer((previous) => {
      const resolved = typeof updates === 'function' ? updates(previous) : updates

      if (!resolved || typeof resolved !== 'object' || Array.isArray(resolved)) {
        return previous
      }

      return finalize({ ...previous, ...resolved })
    })
  }, [])

  const updateUsername = useCallback((username) => {
    pendingImmediateSaveRef.current = true
    setPlayer((previous) => ({
      ...previous,
      username: sanitizeUsername(username),
    }))
  }, [])

  const awardRewards = useCallback((reward) => {
    setPlayer((previous) => finalize(award(previous, reward)))
  }, [])

  const addXP = useCallback((amount) => {
    awardRewards({ xp: amount, coins: 0 })
  }, [awardRewards])

  const addCoins = useCallback((amount) => {
    awardRewards({ xp: 0, coins: amount })
  }, [awardRewards])

  const spendCoins = useCallback((amount) => {
    const preview = calculateCoinSpend(player.coins, amount)

    if (!preview.success) {
      return false
    }

    setPlayer((previous) => {
      const outcome = calculateCoinSpend(previous.coins, amount)

      return outcome.success ? { ...previous, coins: outcome.balance } : previous
    })

    return true
  }, [player.coins])

  const loseHeart = useCallback(() => {
    setPlayer((previous) => ({
      ...previous,
      hearts: Math.max(0, previous.hearts - 1),
    }))
  }, [])

  const restoreHeart = useCallback(() => {
    setPlayer((previous) => ({
      ...previous,
      hearts: Math.min(previous.maxHearts, previous.hearts + 1),
    }))
  }, [])

  const resetHearts = useCallback(() => {
    setPlayer((previous) => ({ ...previous, hearts: previous.maxHearts }))
  }, [])

  const startRun = useCallback(({
    technologyId = null,
    missionId = null,
    mode = 'mission',
    questionIds = [],
  }) => {
    setPlayer((previous) => ({
      ...previous,
      hearts: previous.maxHearts,
      stats: {
        ...previous.stats,
        totalPlaySessions: wholeNumber(previous.stats.totalPlaySessions) + 1,
      },
      session: {
        ...previous.session,
        currentTechnologyId: technologyId,
        currentMissionId: missionId,
        mode,
        activeRun: {
          mode,
          technologyId,
          missionId,
          questionIds,
          currentIndex: 0,
          answers: [],
          startedAt: new Date().toISOString(),
        },
      },
    }))
  }, [])

  const saveRunProgress = useCallback((progress) => {
    setPlayer((previous) => ({
      ...previous,
      session: {
        ...previous.session,
        activeRun: previous.session.activeRun
          ? { ...previous.session.activeRun, ...progress }
          : null,
      },
    }))
  }, [])

  const clearRun = useCallback(() => {
    setPlayer((previous) => ({
      ...previous,
      session: {
        ...previous.session,
        currentTechnologyId: null,
        currentMissionId: null,
        mode: null,
        activeRun: null,
      },
    }))
  }, [])

  const recordAnswer = useCallback(({
    question,
    correct,
    technologyId = question?.technology,
    mode = 'mission',
  }) => {
    if (!question?.id) {
      return
    }

    setPlayer((previous) => {
      const activeRun = previous.session?.activeRun

      if (activeRun?.rewardedQuestionIds?.includes(question.id)) {
        return previous
      }

      const answered = wholeNumber(previous.stats.questionsAnswered) + 1
      const correctCount = wholeNumber(previous.stats.correctAnswers) + (correct ? 1 : 0)
      const wrongCount = wholeNumber(previous.stats.wrongAnswers) + (correct ? 0 : 1)
      const difficulty = String(question.difficulty ?? 'medium').toLowerCase()
      const currentDifficulty = previous.stats.byDifficulty?.[difficulty] ?? {
        answered: 0,
        correct: 0,
      }
      const currentType = previous.stats.byQuestionType?.[question.type] ?? {
        answered: 0,
        correct: 0,
      }
      const currentTechnology = previous.stats.byTechnology?.[technologyId] ?? {
        answered: 0,
        correct: 0,
      }
      const technologyProgress = previous.technologyProgress?.[technologyId] ?? {}
      let next = {
        ...previous,
        hearts: correct ? previous.hearts : Math.max(0, previous.hearts - 1),
        stats: {
          ...previous.stats,
          questionsAnswered: answered,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          accuracy: Math.round((correctCount / answered) * 100),
          byDifficulty: {
            ...previous.stats.byDifficulty,
            [difficulty]: {
              answered: wholeNumber(currentDifficulty.answered) + 1,
              correct: wholeNumber(currentDifficulty.correct) + (correct ? 1 : 0),
            },
          },
          byQuestionType: {
            ...previous.stats.byQuestionType,
            [question.type]: {
              answered: wholeNumber(currentType.answered) + 1,
              correct: wholeNumber(currentType.correct) + (correct ? 1 : 0),
            },
          },
          byTechnology: {
            ...previous.stats.byTechnology,
            [technologyId]: {
              answered: wholeNumber(currentTechnology.answered) + 1,
              correct: wholeNumber(currentTechnology.correct) + (correct ? 1 : 0),
            },
          },
        },
        technologyProgress: technologyId
          ? {
              ...previous.technologyProgress,
              [technologyId]: {
                ...technologyProgress,
                questionsAnswered: wholeNumber(technologyProgress.questionsAnswered) + 1,
                correctAnswers: wholeNumber(technologyProgress.correctAnswers) + (correct ? 1 : 0),
                wrongAnswers: wholeNumber(technologyProgress.wrongAnswers) + (correct ? 0 : 1),
              },
            }
          : previous.technologyProgress,
        revision: {
          ...previous.revision,
          incorrectQuestions: correct
            ? previous.revision.incorrectQuestions
            : unique([...previous.revision.incorrectQuestions, question.id]),
        },
        session: {
          ...previous.session,
          mode,
          activeRun: activeRun
            ? {
                ...activeRun,
                rewardedQuestionIds: unique([
                  ...(activeRun.rewardedQuestionIds ?? []),
                  question.id,
                ]),
              }
            : activeRun,
        },
      }

      if (correct) {
        next = award(next, { xp: question.xp, coins: question.coins })
      }

      return finalize(next)
    })
  }, [])

  const toggleMarkedQuestion = useCallback((questionId) => {
    setPlayer((previous) => {
      const marked = previous.revision.markedQuestions
      const isMarked = marked.includes(questionId)

      return {
        ...previous,
        revision: {
          ...previous.revision,
          markedQuestions: isMarked
            ? marked.filter((id) => id !== questionId)
            : [...marked, questionId],
        },
      }
    })
  }, [])

  const completeMission = useCallback((mission, result = {}) => {
    if (!mission?.id || !mission?.technologyId) {
      return
    }

    pendingImmediateSaveRef.current = true
    setPlayer((previous) => {
      const key = getMissionKey(mission.technologyId, mission.id)
      const alreadyCompleted = previous.completedMissions.some((entry) =>
        typeof entry === 'string'
          ? entry === key
          : entry?.id === key || entry?.missionId === mission.id,
      )
      const worldMissions = getTechnologyMissions(missions, mission.technologyId)
      const nextMission = getNextMission(worldMissions, mission.id)
      const currentProgress = previous.technologyProgress?.[mission.technologyId] ?? {}
      const completedInWorld = alreadyCompleted
        ? wholeNumber(currentProgress.completedMissions)
        : wholeNumber(currentProgress.completedMissions) + 1
      const accuracy = wholeNumber(result.total) > 0
        ? Math.round((wholeNumber(result.correct) / wholeNumber(result.total)) * 100)
        : 0
      const completedAt = new Date().toISOString()
      let next = {
        ...previous,
        hearts: previous.maxHearts,
        completedMissions: alreadyCompleted
          ? previous.completedMissions
          : [
              ...previous.completedMissions,
              {
                id: key,
                technologyId: mission.technologyId,
                missionId: mission.id,
                completedAt,
                accuracy,
              },
            ],
        unlockedMissions: nextMission
          ? unique([
              ...previous.unlockedMissions,
              getMissionKey(mission.technologyId, nextMission.id),
            ])
          : previous.unlockedMissions,
        stats: {
          ...previous.stats,
          missionsCompleted: wholeNumber(previous.stats.missionsCompleted) + (alreadyCompleted ? 0 : 1),
          perfectMissions: wholeNumber(previous.stats.perfectMissions) + (!alreadyCompleted && wholeNumber(result.wrong) === 0 ? 1 : 0),
        },
        streak: alreadyCompleted ? previous.streak : updateStreak(previous.streak, new Date()),
        technologyProgress: {
          ...previous.technologyProgress,
          [mission.technologyId]: {
            ...currentProgress,
            completedMissions: completedInWorld,
            totalMissions: worldMissions.length + 1,
            completionPercentage: worldMissions.length
              ? Math.round((completedInWorld / (worldMissions.length + 1)) * 100)
              : 0,
          },
        },
        session: { ...previous.session, activeRun: null },
      }

      if (!alreadyCompleted) {
        next = award(next, { xp: mission.rewardXP, coins: mission.rewardCoins })
        next = addActivity(
          next,
          ACTIVITY_TYPES.MISSION_COMPLETED,
          `Completed ${mission.name}`,
          { id: key, technologyId: mission.technologyId },
        )
      }

      return finalize(next)
    })
  }, [])

  const defeatBoss = useCallback((boss) => {
    if (!boss?.technologyId) {
      return
    }

    pendingImmediateSaveRef.current = true
    setPlayer((previous) => {
      const currentProgress = previous.technologyProgress?.[boss.technologyId] ?? {}

      if (currentProgress.bossDefeated) {
        return previous
      }

      let next = {
        ...previous,
        hearts: previous.maxHearts,
        stats: {
          ...previous.stats,
          bossBattlesWon: wholeNumber(previous.stats.bossBattlesWon) + 1,
          technologiesCompleted: wholeNumber(previous.stats.technologiesCompleted) + 1,
        },
        streak: updateStreak(previous.streak, new Date()),
        technologyProgress: {
          ...previous.technologyProgress,
          [boss.technologyId]: {
            ...currentProgress,
            bossDefeated: true,
            completed: true,
            completionPercentage: 100,
          },
        },
        session: { ...previous.session, activeRun: null },
      }
      next = award(next, { xp: boss.rewardXP, coins: boss.rewardCoins })
      next = addActivity(
        next,
        ACTIVITY_TYPES.BOSS_DEFEATED,
        `Defeated ${boss.bossName ?? boss.name}`,
        { id: boss.id, technologyId: boss.technologyId },
      )

      return finalize(next)
    })
  }, [])

  const completeDailyChallenge = useCallback((challenge, result = {}) => {
    if (!challenge?.date) {
      return
    }

    pendingImmediateSaveRef.current = true
    setPlayer((previous) => {
      if (
        previous.dailyChallenge.date === challenge.date &&
        previous.dailyChallenge.rewardClaimed
      ) {
        return previous
      }

      let next = {
        ...previous,
        hearts: previous.maxHearts,
        streak: updateStreak(previous.streak, challenge.date),
        dailyChallenge: {
          date: challenge.date,
          completed: true,
          completedTasks: challenge.questionIds ?? [],
          rewardClaimed: true,
          score: wholeNumber(result.correct),
          totalQuestions: wholeNumber(result.total),
        },
        session: { ...previous.session, activeRun: null },
      }
      next = award(next, challenge.reward)
      next = addActivity(
        next,
        ACTIVITY_TYPES.DAILY_CHALLENGE_COMPLETED,
        `Completed the ${challenge.date} daily challenge`,
        { id: challenge.id },
      )

      return finalize(next)
    })
  }, [])

  const updateSettings = useCallback((settings) => {
    pendingImmediateSaveRef.current = true
    setPlayer((previous) => ({
      ...previous,
      settings: { ...previous.settings, ...settings },
    }))
  }, [])

  const updateLastVisitedRoute = useCallback((route) => {
    setPlayer((previous) => {
      if (previous.session.lastVisitedRoute === route) {
        return previous
      }

      return {
        ...previous,
        session: { ...previous.session, lastVisitedRoute: route },
      }
    })
  }, [])

  const resetPlayer = useCallback(() => {
    const freshPlayer = createDefaultPlayer(user?.name)
    pendingImmediateSaveRef.current = true
    previousLevel.current = freshPlayer.level
    setLevelUpNotification(null)
    setPlayer(freshPlayer)
    return freshPlayer
  }, [user?.name])

  const dismissLevelUp = useCallback(() => setLevelUpNotification(null), [])
  const retryCloudLoad = useCallback(() => {
    setCloudError('')
    setCloudLoadingState(true)
    setReloadVersion((version) => version + 1)
  }, [])

  const value = useMemo(() => ({
    player,
    levelUpNotification,
    cloudLoading,
    cloudError,
    saveStatus,
    saveProgress,
    retryCloudLoad,
    updatePlayer,
    updateUsername,
    awardRewards,
    addXP,
    addCoins,
    spendCoins,
    loseHeart,
    restoreHeart,
    resetHearts,
    startRun,
    saveRunProgress,
    clearRun,
    recordAnswer,
    toggleMarkedQuestion,
    completeMission,
    defeatBoss,
    completeDailyChallenge,
    updateSettings,
    updateLastVisitedRoute,
    resetPlayer,
    dismissLevelUp,
  }), [
    player,
    levelUpNotification,
    cloudLoading,
    cloudError,
    saveStatus,
    saveProgress,
    retryCloudLoad,
    updatePlayer,
    updateUsername,
    awardRewards,
    addXP,
    addCoins,
    spendCoins,
    loseHeart,
    restoreHeart,
    resetHearts,
    startRun,
    saveRunProgress,
    clearRun,
    recordAnswer,
    toggleMarkedQuestion,
    completeMission,
    defeatBoss,
    completeDailyChallenge,
    updateSettings,
    updateLastVisitedRoute,
    resetPlayer,
    dismissLevelUp,
  ])

  if (cloudLoading) {
    return (
      <div className="route-loader" role="status" aria-live="polite">
        <span className="route-loader-mark" aria-hidden="true">{'</>'}</span>
        <span>Loading your adventure…</span>
      </div>
    )
  }

  if (isAuthenticated && saveStatus === 'error' && !cloudWriteEnabled) {
    return (
      <main className="cloud-error-page">
        <section className="game-card cloud-error-card" aria-labelledby="cloud-error-title">
          <p className="page-eyebrow">CLOUD LINK INTERRUPTED</p>
          <h1 id="cloud-error-title">Your adventure could not be loaded.</h1>
          <p>{cloudError || 'CodeQuest could not reach your saved progress. No cloud data was replaced.'}</p>
          <div className="button-group">
            <button className="btn btn-primary" onClick={retryCloudLoad} type="button">TRY AGAIN</button>
            <button className="btn btn-ghost" onClick={logout} type="button">LOG OUT</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <GameContext.Provider value={value}>
      {saveStatus === 'offline' && cloudError ? (
        <div className="cloud-sync-banner" role="status">
          <span>{cloudError}</span>
          <button onClick={retryCloudLoad} type="button">Retry cloud sync</button>
        </div>
      ) : null}
      {children}
      <Modal
        actions={(
          <>
            <button
              className="btn btn-ghost"
              disabled={migrationSaving}
              onClick={keepCloudProgress}
              type="button"
            >
              START FRESH
            </button>
            <button
              className="btn btn-primary"
              disabled={migrationSaving}
              onClick={() => void importLocalProgress()}
              type="button"
            >
              {migrationSaving ? 'UPLOADING…' : 'USE LOCAL PROGRESS'}
            </button>
          </>
        )}
        description={migrationSource === 'cache'
          ? 'This device has cached progress that differs from MongoDB. Choose which version should become your account save.'
          : 'Existing local progress was found from before accounts were enabled. Choose whether to upload it or keep the fresh cloud adventure.'}
        dismissible={false}
        open={Boolean(legacyMigrationPlayer)}
        title="Choose your saved adventure"
      >
        {legacyMigrationPlayer ? (
          <div className="migration-summary">
            <div>
              <span>Local</span>
              <strong>Level {legacyMigrationPlayer.level}</strong>
              <small>{legacyMigrationPlayer.totalXP} XP · {legacyMigrationPlayer.completedMissions.length} missions</small>
            </div>
            <div>
              <span>Cloud</span>
              <strong>Level {player.level}</strong>
              <small>{player.totalXP} XP · {player.completedMissions.length} missions</small>
            </div>
          </div>
        ) : null}
        {migrationError ? <p className="migration-error" role="alert">{migrationError}</p> : null}
      </Modal>
    </GameContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function useGame() {
  const context = useContext(GameContext)

  if (context === null) {
    throw new Error('useGame must be used within a GameProvider')
  }

  return context
}

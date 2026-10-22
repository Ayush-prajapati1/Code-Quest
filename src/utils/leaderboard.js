import { calculateLevel } from './xp.js'

export const SIMULATED_LEADERBOARD_PLAYERS = Object.freeze([
  Object.freeze({ id: 'sim-nova', name: 'NovaByte', level: 18, xp: 45_850, missionsCompleted: 42 }),
  Object.freeze({ id: 'sim-aria', name: 'AriaLoop', level: 14, xp: 28_240, missionsCompleted: 34 }),
  Object.freeze({ id: 'sim-kai', name: 'KaiCompiler', level: 11, xp: 17_180, missionsCompleted: 27 }),
  Object.freeze({ id: 'sim-luna', name: 'LunaLogic', level: 8, xp: 9_620, missionsCompleted: 19 }),
  Object.freeze({ id: 'sim-dev', name: 'DevNomad', level: 5, xp: 3_780, missionsCompleted: 11 }),
  Object.freeze({ id: 'sim-pixel', name: 'PixelPilot', level: 3, xp: 1_250, missionsCompleted: 5 }),
])

function toCount(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0
}

function normalizeLeaderboardEntry(entry, index) {
  const totalXP = toCount(entry?.xp ?? entry?.totalXP)

  return {
    id: String(entry?.id ?? `leaderboard-player-${index}`),
    name: String(entry?.name ?? entry?.username ?? 'Player'),
    level: Math.max(1, toCount(entry?.level) || calculateLevel(totalXP)),
    xp: totalXP,
    missionsCompleted: toCount(
      entry?.missionsCompleted ?? entry?.stats?.missionsCompleted,
    ),
    isCurrentPlayer: Boolean(entry?.isCurrentPlayer),
  }
}

export function compareLeaderboardEntries(left, right) {
  return (
    right.xp - left.xp ||
    right.level - left.level ||
    right.missionsCompleted - left.missionsCompleted ||
    left.name.localeCompare(right.name)
  )
}

export function rankLeaderboard(entries) {
  if (!Array.isArray(entries)) {
    return []
  }

  const sortedEntries = entries
    .map(normalizeLeaderboardEntry)
    .sort(compareLeaderboardEntries)

  return sortedEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }))
}

export function createPlayerLeaderboardEntry(player) {
  return normalizeLeaderboardEntry(
    {
      id: player?.id ?? 'current-player',
      name: player?.username ?? 'Player',
      level: player?.level,
      xp: player?.totalXP,
      missionsCompleted: player?.stats?.missionsCompleted,
      isCurrentPlayer: true,
    },
    0,
  )
}

export function buildLeaderboard(
  player,
  simulatedPlayers = SIMULATED_LEADERBOARD_PLAYERS,
) {
  const opponents = Array.isArray(simulatedPlayers)
    ? simulatedPlayers.filter((entry) => entry?.id !== player?.id)
    : []

  return rankLeaderboard([
    ...opponents,
    createPlayerLeaderboardEntry(player),
  ])
}

export function getPlayerLeaderboardPosition(leaderboard) {
  if (!Array.isArray(leaderboard)) {
    return null
  }

  return leaderboard.find((entry) => entry.isCurrentPlayer) ?? null
}

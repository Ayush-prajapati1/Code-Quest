import { rewardCoins } from './coins.js'
import { getRank } from './levels.js'
import { addXP, normalizeXP } from './xp.js'

export const DEFAULT_LEVEL_UP_COIN_REWARD = 100

function normalizeRewardAmount(value) {
  return normalizeXP(value)
}

export function normalizeReward(reward = {}) {
  if (reward === null || typeof reward !== 'object' || Array.isArray(reward)) {
    return { xp: 0, coins: 0 }
  }

  return {
    xp: normalizeRewardAmount(reward.xp ?? reward.rewardXP),
    coins: normalizeRewardAmount(reward.coins ?? reward.rewardCoins),
  }
}

export function combineRewards(...rewards) {
  return rewards.reduce(
    (total, reward) => {
      const normalizedReward = normalizeReward(reward)

      return {
        xp: Math.min(Number.MAX_SAFE_INTEGER, total.xp + normalizedReward.xp),
        coins: Math.min(
          Number.MAX_SAFE_INTEGER,
          total.coins + normalizedReward.coins,
        ),
      }
    },
    { xp: 0, coins: 0 },
  )
}

export function calculateRewardOutcome(
  player,
  reward,
  options = {},
) {
  const normalizedPlayer =
    player !== null && typeof player === 'object' ? player : {}
  const normalizedReward = normalizeReward(reward)
  const xpOutcome = addXP(normalizedPlayer.totalXP, normalizedReward.xp)
  const configuredLevelReward = normalizeRewardAmount(
    options.levelUpCoinReward ?? DEFAULT_LEVEL_UP_COIN_REWARD,
  )
  const levelUpCoins = xpOutcome.levelsGained * configuredLevelReward
  const coinsAwarded = Math.min(
    Number.MAX_SAFE_INTEGER,
    normalizedReward.coins + levelUpCoins,
  )

  return {
    xp: xpOutcome,
    baseReward: normalizedReward,
    levelUpCoins,
    coinsAwarded,
    nextCoins: rewardCoins(normalizedPlayer.coins, coinsAwarded),
    nextRank: getRank(xpOutcome.level),
  }
}

export function applyRewardToPlayer(player, reward, options = {}) {
  if (player === null || typeof player !== 'object' || Array.isArray(player)) {
    return { player, outcome: null }
  }

  const outcome = calculateRewardOutcome(player, reward, options)

  return {
    player: {
      ...player,
      level: outcome.xp.level,
      totalXP: outcome.xp.totalXP,
      currentLevelXP: outcome.xp.currentLevelXP,
      coins: outcome.nextCoins,
      rank: outcome.nextRank,
    },
    outcome,
  }
}

export const applyRewards = applyRewardToPlayer

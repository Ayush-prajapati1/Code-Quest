function toCoinAmount(value, fallback = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)))
}

export function normalizeCoins(value) {
  return toCoinAmount(value)
}

export function normalizeCoinReward(value) {
  return toCoinAmount(value)
}

export function rewardCoins(currentCoins, rewardAmount) {
  const balance = normalizeCoins(currentCoins)
  const reward = normalizeCoinReward(rewardAmount)

  return Math.min(Number.MAX_SAFE_INTEGER, balance + reward)
}

export const addCoins = rewardCoins

export function canAfford(currentCoins, cost) {
  const normalizedCost =
    typeof cost === 'number' && Number.isFinite(cost) && cost >= 0
      ? toCoinAmount(cost)
      : -1

  return normalizedCost >= 0 && normalizeCoins(currentCoins) >= normalizedCost
}

export function spendCoins(currentCoins, cost) {
  const balance = normalizeCoins(currentCoins)
  const normalizedCost =
    typeof cost === 'number' && Number.isFinite(cost) && cost >= 0
      ? toCoinAmount(cost)
      : -1

  if (normalizedCost < 0 || balance < normalizedCost) {
    return {
      success: false,
      balance,
      spent: 0,
      shortfall:
        normalizedCost < 0 ? 0 : Math.max(0, normalizedCost - balance),
    }
  }

  return {
    success: true,
    balance: balance - normalizedCost,
    spent: normalizedCost,
    shortfall: 0,
  }
}

export function deductCoins(currentCoins, cost) {
  return spendCoins(currentCoins, cost).balance
}

export function applyCoinDelta(currentCoins, delta) {
  if (typeof delta !== 'number' || !Number.isFinite(delta)) {
    return normalizeCoins(currentCoins)
  }

  return delta >= 0
    ? rewardCoins(currentCoins, delta)
    : deductCoins(currentCoins, Math.abs(delta))
}

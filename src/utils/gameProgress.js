export function getMissionKey(technologyId, missionId) {
  return `${technologyId}:${missionId}`
}

export function getTechnologyMissions(missions, technologyId) {
  return missions.filter(
    (mission) => mission.technologyId === technologyId && !mission.boss,
  )
}

export function isMissionCompleted(player, technologyId, missionId) {
  const key = getMissionKey(technologyId, missionId)

  return player.completedMissions.some((completedMission) => {
    if (typeof completedMission === 'string') {
      return completedMission === key || completedMission === missionId
    }

    return completedMission?.id === key || (
      completedMission?.technologyId === technologyId &&
      completedMission?.missionId === missionId
    )
  })
}

export function isMissionUnlocked(player, technologyMissions, missionId) {
  const missionIndex = technologyMissions.findIndex(
    (mission) => mission.id === missionId,
  )

  if (missionIndex <= 0) {
    return missionIndex === 0
  }

  const mission = technologyMissions[missionIndex]
  const missionKey = getMissionKey(mission.technologyId, mission.id)

  return (
    player.unlockedMissions.includes(missionKey) ||
    isMissionCompleted(
      player,
      technologyMissions[missionIndex - 1].technologyId,
      technologyMissions[missionIndex - 1].id,
    )
  )
}

export function getNextMission(technologyMissions, missionId) {
  const missionIndex = technologyMissions.findIndex(
    (mission) => mission.id === missionId,
  )

  return missionIndex >= 0 ? technologyMissions[missionIndex + 1] ?? null : null
}

export function getTechnologyCompletion(player, missions, technologyId) {
  const technologyMissions = getTechnologyMissions(missions, technologyId)
  const completedMissionCount = technologyMissions.filter((mission) =>
    isMissionCompleted(player, technologyId, mission.id),
  ).length
  const bossDefeated = Boolean(
    player.technologyProgress[technologyId]?.bossDefeated,
  )
  const totalObjectives = technologyMissions.length + 1
  const completedObjectives = completedMissionCount + (bossDefeated ? 1 : 0)

  return {
    bossDefeated,
    completedMissionCount,
    missionCount: technologyMissions.length,
    percentage: totalObjectives > 0
      ? Math.round((completedObjectives / totalObjectives) * 100)
      : 0,
  }
}

export function isTechnologyUnlocked(player, technologies, missions, technology) {
  if (!technology.prerequisite) {
    return true
  }

  const prerequisite = technologies.find(
    (candidate) => candidate.id === technology.prerequisite,
  )

  if (!prerequisite) {
    return true
  }

  return getTechnologyCompletion(player, missions, prerequisite.id).bossDefeated
}

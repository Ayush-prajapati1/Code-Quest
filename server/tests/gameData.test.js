import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createDefaultGameData,
  ProgressValidationError,
  sanitizeProgressUpdate,
} from '../utils/gameData.js'
import { createDefaultPlayer } from '../../src/data/player.js'

const identity = {
  id: 'server-owned-user-id',
  username: 'Ada',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
}

test('new players receive the expected safe defaults', () => {
  const gameData = createDefaultGameData('Ada', identity)

  assert.equal(gameData.id, identity.id)
  assert.equal(gameData.username, 'Ada')
  assert.equal(gameData.level, 1)
  assert.equal(gameData.totalXP, 0)
  assert.equal(gameData.coins, 100)
  assert.equal(gameData.hearts, 3)
})

test('progress updates preserve server-owned identity fields', () => {
  const current = createDefaultGameData('Ada', identity)
  const updated = sanitizeProgressUpdate({
    id: 'attacker-controlled-id',
    createdAt: '2030-01-01T00:00:00.000Z',
    coins: 250,
  }, current, identity)

  assert.equal(updated.id, identity.id)
  assert.equal(updated.createdAt, identity.createdAt.toISOString())
  assert.equal(updated.coins, 250)
})

test('negative progress values are rejected', () => {
  const current = createDefaultGameData('Ada', identity)

  assert.throws(
    () => sanitizeProgressUpdate({ totalXP: -1 }, current, identity),
    ProgressValidationError,
  )
})

test('hearts cannot exceed maxHearts', () => {
  const current = createDefaultGameData('Ada', identity)

  assert.throws(
    () => sanitizeProgressUpdate({ hearts: 4, maxHearts: 3 }, current, identity),
    ProgressValidationError,
  )
})

test('unknown and protected fields are not persisted', () => {
  const current = createDefaultGameData('Ada', identity)
  const updated = sanitizeProgressUpdate({
    email: 'not-allowed@example.com',
    password: 'not-allowed',
    arbitrary: { admin: true },
    settings: { soundEnabled: false },
  }, current, identity)

  assert.equal(Object.hasOwn(updated, 'email'), false)
  assert.equal(Object.hasOwn(updated, 'password'), false)
  assert.equal(Object.hasOwn(updated, 'arbitrary'), false)
  assert.equal(updated.settings.soundEnabled, false)
})

test('the server accepts the frontend player model and every UI difficulty preference', () => {
  const current = createDefaultGameData('Ada', identity)

  for (const difficultyPreference of ['relaxed', 'balanced', 'challenging']) {
    const frontendPlayer = createDefaultPlayer('Ada')
    frontendPlayer.settings.difficultyPreference = difficultyPreference
    frontendPlayer.session.activeRun = {
      mode: 'mission',
      technologyId: 'javascript',
      missionId: 'javascript-1',
      questionIds: ['javascript-basics-1'],
      currentIndex: 0,
      answers: [],
      startedAt: '2026-01-02T00:00:00.000Z',
    }

    const updated = sanitizeProgressUpdate(frontendPlayer, current, identity)

    assert.equal(updated.settings.difficultyPreference, difficultyPreference)
    assert.equal(updated.session.activeRun.missionId, 'javascript-1')
    assert.equal(updated.id, identity.id)
  }
})

import jwt from 'jsonwebtoken'
import { normalizeGameData } from './gameData.js'

export function createToken(userId) {
  const secret = process.env.JWT_SECRET?.trim()

  if (!secret) {
    const error = new Error('JWT authentication is not configured')
    error.statusCode = 500
    throw error
  }

  return jwt.sign(
    { userId: userId.toString() },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN?.trim() || '7d' },
  )
}

export function toSafeUser(user) {
  const id = user._id.toString()
  const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)

  return {
    id,
    name: user.name,
    email: user.email,
    gameData: normalizeGameData(user.gameData, {
      id,
      username: user.name,
      createdAt,
    }),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

import User from '../models/User.js'
import {
  normalizeGameData,
  ProgressValidationError,
  sanitizeProgressUpdate,
} from '../utils/gameData.js'

function identityFor(user) {
  return {
    id: user._id.toString(),
    username: user.name,
    createdAt: user.createdAt,
  }
}

export async function getProgress(req, res, next) {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const gameData = normalizeGameData(user.gameData, identityFor(user))
    return res.status(200).json({ gameData })
  } catch (error) {
    return next(error)
  }
}

export async function updateProgress(req, res, next) {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const submittedProgress = Object.hasOwn(req.body ?? {}, 'gameData')
      ? req.body.gameData
      : req.body

    const gameData = sanitizeProgressUpdate(
      submittedProgress,
      user.gameData,
      identityFor(user),
    )

    user.gameData = gameData
    user.markModified('gameData')
    await user.save()

    return res.status(200).json({
      message: 'Progress saved',
      gameData,
    })
  } catch (error) {
    if (error instanceof ProgressValidationError) {
      return res.status(400).json({ message: error.message })
    }
    return next(error)
  }
}

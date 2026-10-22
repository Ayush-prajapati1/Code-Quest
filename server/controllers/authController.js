import User from '../models/User.js'
import { createToken, toSafeUser } from '../utils/auth.js'
import { createDefaultGameData } from '../utils/gameData.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export async function register(req, res, next) {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const email = normalizeEmail(req.body?.email)
    const password = typeof req.body?.password === 'string' ? req.body.password : ''

    if (!name || name.length > 50) {
      return res.status(400).json({ message: 'Name is required and must be 50 characters or fewer' })
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return res.status(400).json({ message: 'Enter a valid email address' })
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 8 and 128 characters' })
    }

    const existingUser = await User.exists({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }

    const user = new User({ name, email, password })
    user.gameData = createDefaultGameData(name, {
      id: user._id.toString(),
      createdAt: new Date(),
    })
    await user.save()

    return res.status(201).json({
      token: createToken(user._id),
      user: toSafeUser(user),
    })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }
    return next(error)
  }
}

export async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email)
    const password = typeof req.body?.password === 'string' ? req.body.password : ''

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    return res.status(200).json({
      token: createToken(user._id),
      user: toSafeUser(user),
    })
  } catch (error) {
    return next(error)
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({ user: toSafeUser(user) })
  } catch (error) {
    return next(error)
  }
}

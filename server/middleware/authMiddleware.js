import jwt from 'jsonwebtoken'

export default function authMiddleware(req, res, next) {
  const authorization = req.get('authorization')

  if (!authorization) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const [scheme, token, extra] = authorization.trim().split(/\s+/)
  if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }

  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) {
    return res.status(500).json({ message: 'Server authentication is not configured' })
  }

  try {
    const payload = jwt.verify(token, secret)
    if (!payload || typeof payload !== 'object' || typeof payload.userId !== 'string') {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    req.userId = payload.userId
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import playerRoutes from './routes/playerRoutes.js'

export const app = express()

function configuredOrigins() {
  return (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

const allowedOrigins = configuredOrigins()

app.disable('x-powered-by')
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    const error = new Error('Origin is not allowed by CORS')
    error.statusCode = 403
    return callback(error)
  },
}))
app.use(express.json({ limit: '512kb' }))

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/player', playerRoutes)

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Invalid JSON body' })
  }

  const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500
  if (statusCode >= 500) {
    console.error('Request failed:', error?.message || 'Unknown server error')
  }

  return res.status(statusCode).json({
    message: statusCode >= 500 ? 'Internal server error' : error.message,
  })
})

export async function startServer() {
  await connectDB()

  const configuredPort = Number(process.env.PORT)
  const port = Number.isInteger(configuredPort) && configuredPort > 0
    ? configuredPort
    : 5000

  return app.listen(port, () => {
    console.log(`CodeQuest API listening on port ${port}`)
  })
}

const currentFile = fileURLToPath(import.meta.url)
const executedFile = process.argv[1] ? path.resolve(process.argv[1]) : ''

if (currentFile === executedFile) {
  startServer().catch((error) => {
    console.error(error?.message || 'Server startup failed')
    process.exitCode = 1
  })
}

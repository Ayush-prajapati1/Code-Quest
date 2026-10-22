import mongoose from 'mongoose'

export default async function connectDB() {
  const mongoUri = process.env.MONGODB_URI?.trim()

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured')
  }

  try {
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection failed')
    throw new Error('Unable to connect to MongoDB', { cause: error })
  }
}

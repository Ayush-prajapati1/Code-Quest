import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { createDefaultGameData } from '../utils/gameData.js'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    gameData: {
      type: mongoose.Schema.Types.Mixed,
      default: () => createDefaultGameData(),
    },
  },
  {
    timestamps: true,
    minimize: false,
  },
)

userSchema.pre('validate', function setGameIdentity() {
  const currentData = this.gameData && typeof this.gameData === 'object'
    ? this.gameData
    : createDefaultGameData(this.name)

  this.gameData = {
    ...currentData,
    id: this._id.toString(),
    username: currentData.username || this.name,
    createdAt: currentData.createdAt || this.createdAt?.toISOString() || new Date().toISOString(),
  }
})

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return
  }

  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model('User', userSchema)

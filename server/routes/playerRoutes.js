import { Router } from 'express'
import { getProgress, updateProgress } from '../controllers/playerController.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = Router()

router.use(authMiddleware)
router.get('/progress', getProgress)
router.put('/progress', updateProgress)

export default router

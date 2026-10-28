import express from 'express'
import { getSettings, updateSettings } from '../controllers/settingsController.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js'

const router = express.Router()

// public: checkout totals, footer and help pages
router.get('/', getSettings)
// admin: Store settings page
router.put('/', isAuthenticated, isAdmin, updateSettings)

export default router

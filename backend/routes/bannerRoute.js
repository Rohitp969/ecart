import express from 'express'
import { createBanner, deleteBanner, getActiveBanners, getAllBanners, updateBanner } from '../controllers/bannerController.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js'
import { singleUpload } from '../middleware/multer.js'

const router = express.Router()

// public: home page slider and promo cards
router.get('/', getActiveBanners)

// admin
router.get('/all', isAuthenticated, isAdmin, getAllBanners)
router.post('/', isAuthenticated, isAdmin, singleUpload, createBanner)
router.put('/:id', isAuthenticated, isAdmin, singleUpload, updateBanner)
router.delete('/:id', isAuthenticated, isAdmin, deleteBanner)

export default router

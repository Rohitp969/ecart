import express from 'express'
import { applyCoupon, createCoupon, deleteCoupon, getCoupons, updateCoupon } from '../controllers/couponController.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js'

const router = express.Router()

// signed-in customer: check a code at checkout
router.post('/apply', isAuthenticated, applyCoupon)

// admin
router.get('/', isAuthenticated, isAdmin, getCoupons)
router.post('/', isAuthenticated, isAdmin, createCoupon)
router.put('/:id', isAuthenticated, isAdmin, updateCoupon)
router.delete('/:id', isAuthenticated, isAdmin, deleteCoupon)

export default router

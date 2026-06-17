import { createOrder, getAllOrdersAdmin, getMyOrder, getSalesData, getUserOrders, varifyPayment } from '../controllers/orderController.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js'
import express from 'express'

const router = express.Router()

router.post("/create-order", isAuthenticated, createOrder)
router.post("/verify-payment", isAuthenticated, varifyPayment)
router.get("/myorder", isAuthenticated, getMyOrder)
router.get("/all", isAuthenticated, isAdmin, getAllOrdersAdmin)
router.get("/user-order/:userId", isAuthenticated, isAdmin, getUserOrders)
router.get("/sales",isAuthenticated, isAdmin, isAdmin, getSalesData)

export default router
import { cancelMyOrder, createOrder, getAdminAlerts, getAllOrdersAdmin, getOrderAdmin, getMyOrder, getSalesData, getUserOrders, updateOrderStatus, varifyPayment } from '../controllers/orderController.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js'
import express from 'express'

const router = express.Router()

router.post("/create-order", isAuthenticated, createOrder)
router.post("/verify-payment", isAuthenticated, varifyPayment)
router.get("/myorder", isAuthenticated, getMyOrder)
router.put("/:orderId/cancel", isAuthenticated, cancelMyOrder)
router.get("/all", isAuthenticated, isAdmin, getAllOrdersAdmin)
router.get("/user-order/:userId", isAuthenticated, isAdmin, getUserOrders)
router.get("/sales", isAuthenticated, isAdmin, getSalesData)
router.get("/alerts", isAuthenticated, isAdmin, getAdminAlerts)
router.get("/admin/:orderId", isAuthenticated, isAdmin, getOrderAdmin)
router.put("/:orderId/status", isAuthenticated, isAdmin, updateOrderStatus)

export default router
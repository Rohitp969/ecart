import express from 'express'
import {
  deleteContactMessage,
  deleteSubscriber,
  getContactMessages,
  getMyNewsletter,
  getSubscribers,
  setMyNewsletter,
  submitContact,
  subscribe,
  trackOrder,
  updateMessageStatus,
} from '../controllers/supportController.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js'

const router = express.Router()

// public: store footer + help pages
router.post('/subscribe', subscribe)
router.post('/contact', submitContact)
router.post('/track-order', trackOrder)

// signed-in user's newsletter preference (account settings)
router.get('/newsletter', isAuthenticated, getMyNewsletter)
router.put('/newsletter', isAuthenticated, setMyNewsletter)

// admin inbox
router.get('/messages', isAuthenticated, isAdmin, getContactMessages)
router.put('/messages/:id', isAuthenticated, isAdmin, updateMessageStatus)
router.delete('/messages/:id', isAuthenticated, isAdmin, deleteContactMessage)
router.get('/subscribers', isAuthenticated, isAdmin, getSubscribers)
router.delete('/subscribers/:id', isAuthenticated, isAdmin, deleteSubscriber)

export default router

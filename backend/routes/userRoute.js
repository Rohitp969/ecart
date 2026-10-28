import express from 'express'
import { changeSignupEmail, forgotPassword, login, logout, register, resendEmailOtp, resetPassword, verifyEmailOtp, verifyOTP } from '../controllers/authController.js'
import { allUser, deleteUserByAdmin, getUserById, setUserBlocked, updatePassword, updateUser } from '../controllers/userController.js'
import { addAddress, deleteAccount, deleteAddress, getAddresses, setDefaultAddress, updateAddress } from '../controllers/accountController.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js'
import { authLimiter, codeLimiter, mailLimiter } from '../middleware/rateLimit.js'
import { singleUpload } from '../middleware/multer.js'

const router = express.Router()

// signup + email verification with a 6-digit code (valid 5 min, resend after 30s)
router.post('/register', authLimiter, register)
router.post('/verify-email', codeLimiter, verifyEmailOtp)
router.post('/resend-email-otp', mailLimiter, resendEmailOtp)
router.post('/change-email', mailLimiter, changeSignupEmail)

// session
router.post('/login', authLimiter, login)
router.post('/logout', isAuthenticated, logout)

// forgot password: email OTP → verify OTP (returns reset token) → set new password
router.post('/forgot-password', mailLimiter, forgotPassword)
router.post('/verify-otp/:email', codeLimiter, verifyOTP)
router.post('/change-password/:email', codeLimiter, resetPassword)

// signed-in account
router.put('/update-password', isAuthenticated, updatePassword)
router.delete('/me', isAuthenticated, deleteAccount)
router.put("/update/:id", isAuthenticated, singleUpload, updateUser)
router.get('/get-user/:userId', isAuthenticated, getUserById)

// address book
router.get('/addresses', isAuthenticated, getAddresses)
router.post('/addresses', isAuthenticated, addAddress)
router.put('/addresses/:addressId', isAuthenticated, updateAddress)
router.delete('/addresses/:addressId', isAuthenticated, deleteAddress)
router.put('/addresses/:addressId/default', isAuthenticated, setDefaultAddress)

// admin
router.get('/all-user', isAuthenticated, isAdmin,  allUser)
router.put('/:id/block', isAuthenticated, isAdmin, setUserBlocked)
router.delete('/:id', isAuthenticated, isAdmin, deleteUserByAdmin)

export default router

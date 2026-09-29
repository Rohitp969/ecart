import express from 'express'
import { forgotPassword, login, logout, register, resetPassword, reVerify, verify, verifyOTP } from '../controllers/authController.js'
import { allUser, getUserById, updatePassword, updateUser } from '../controllers/userController.js'
import { addAddress, deleteAccount, deleteAddress, getAddresses, setDefaultAddress, updateAddress } from '../controllers/accountController.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js'
import { singleUpload } from '../middleware/multer.js'

const router = express.Router()

// signup + email verification
router.post('/register', register)
router.post('/verify', verify)
router.post('/reVerify', reVerify)

// session
router.post('/login', login)
router.post('/logout', isAuthenticated, logout)

// forgot password: email OTP → verify OTP (returns reset token) → set new password
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp/:email', verifyOTP)
router.post('/change-password/:email', resetPassword)

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

export default router

import { multipleUpload } from '../middleware/multer.js'
import { addProduct, deleteProduct, getAllProduct, updateProduct } from '../controllers/productController.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js'
import express from 'express'

const router = express.Router()

router.post('/add', isAuthenticated, isAdmin, multipleUpload, addProduct)
router.get('/getallproducts', getAllProduct)
router.delete('/delete/:productId', isAuthenticated, isAdmin, deleteProduct)
router.put('/update/:productId', isAuthenticated, isAdmin, multipleUpload, updateProduct)

export default router
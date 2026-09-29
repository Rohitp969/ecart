import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'sonner'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import ProductForm from '@/components/admin/ProductForm'
import { setProducts } from '@/redux/productSlice'
import { API_URL, authConfig } from '@/lib/admin'

const AddProduct = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { products } = useSelector((store) => store.product)

  const createProduct = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/api/v1/product/add`, formData, authConfig())
      if (res.data.success) {
        dispatch(setProducts([res.data.product, ...products]))
        toast.success('Product added to the store')
        navigate('/dashboard/products')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add product')
    }
  }

  return (
    <div>
      <AdminPageHeader title='Add Product' description='Create a new product listing for your store' />
      <ProductForm submitLabel='Publish product' onSubmit={createProduct} />
    </div>
  )
}

export default AddProduct

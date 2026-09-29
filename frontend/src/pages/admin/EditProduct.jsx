import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { toast } from 'sonner'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import ProductForm from '@/components/admin/ProductForm'
import { Skeleton } from '@/components/ui/skeleton'
import useProducts from '@/hooks/useProducts'
import { setProducts } from '@/redux/productSlice'
import { API_URL, authConfig } from '@/lib/admin'

const EditProduct = () => {
  const { id } = useParams()
  const { products, loading } = useProducts()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const product = products.find((p) => p._id === id)

  const updateProduct = async (formData) => {
    try {
      const res = await axios.put(`${API_URL}/api/v1/product/update/${id}`, formData, authConfig())
      if (res.data.success) {
        dispatch(setProducts(products.map((p) => (p._id === id ? res.data.product : p))))
        toast.success('Product updated')
        navigate('/dashboard/products')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update product')
    }
  }

  if (!product) {
    return loading ? (
      <div className='space-y-4'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-96 w-full rounded-2xl' />
      </div>
    ) : (
      <div className='rounded-2xl bg-white p-10 text-center shadow-sm'>
        <p className='font-semibold text-gray-900'>Product not found</p>
        <Link to='/dashboard/products' className='mt-3 inline-block text-sm font-semibold text-pink-600 hover:underline'>
          Back to products
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to='/dashboard/products' className='mb-3 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900'>
        <ArrowLeft className='h-4 w-4' /> Products
      </Link>
      <AdminPageHeader title='Edit Product' description={product.productName}>
        <Link
          to={`/products/${product._id}`}
          target='_blank'
          className='flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50'
        >
          <ExternalLink className='h-4 w-4' /> View in store
        </Link>
      </AdminPageHeader>
      {/* key: reset the form if the product changes underneath (e.g. refreshed catalog) */}
      <ProductForm key={product._id} product={product} submitLabel='Save changes' onSubmit={updateProduct} />
    </div>
  )
}

export default EditProduct

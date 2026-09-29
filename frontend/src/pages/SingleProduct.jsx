import React, { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PackageX } from 'lucide-react'
import Breadkrums from '../components/Breadkrums'
import ProductImg from '../components/ProductImg'
import ProductDesc from '../components/ProductDesc'
import ProductRow from '../components/ProductRow'
import { Skeleton } from '@/components/ui/skeleton'
import useProducts from '../hooks/useProducts'
import { getCategory } from '../lib/catalog'

const SingleProduct = () => {
  const { id: productId } = useParams()
  const { products, loading } = useProducts()
  const product = products.find((item) => item._id === productId)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [productId])

  const similar = useMemo(() => {
    if (!product) return []
    const slug = getCategory(product).slug
    return products
      .filter((p) => p._id !== product._id && getCategory(p).slug === slug)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 12)
  }, [products, product])

  if (!product) {
    return (
      <div className='min-h-screen bg-gray-50 pt-20 pb-12 md:pt-24'>
        <div className='max-w-7xl mx-auto px-4'>
          {loading ? (
            <div className='grid gap-8 rounded-2xl bg-white p-4 sm:p-8 lg:grid-cols-2'>
              <Skeleton className='h-80 w-full sm:h-96 lg:h-120' />
              <div className='space-y-4'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-8 w-40' />
                <Skeleton className='h-24 w-full' />
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm'>
              <PackageX className='h-14 w-14 text-gray-300' />
              <h1 className='mt-4 text-xl font-bold text-gray-900'>Product not found</h1>
              <p className='mt-1 text-sm text-gray-500'>It may have been removed or the link is wrong.</p>
              <Link to='/products' className='mt-5 rounded-full bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-pink-700'>
                Browse products
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 pt-20 pb-12 md:pt-24'>
      <div className='max-w-7xl mx-auto px-4 space-y-6'>
        <Breadkrums product={product}/>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start rounded-2xl bg-white p-4 shadow-sm sm:p-8">
          <ProductImg key={product._id} images={product.productImg} name={product.productName}/>
          <ProductDesc product={product}/>
        </div>
        <ProductRow
          title='Similar Products'
          subtitle={`More from ${getCategory(product).name}`}
          viewAllTo={`/products?category=${getCategory(product).slug}`}
          products={similar}
        />
      </div>
    </div>
  )
}

export default SingleProduct

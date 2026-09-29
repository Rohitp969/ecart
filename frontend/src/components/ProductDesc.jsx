import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, RotateCcw, ShieldCheck, ShoppingCart, Truck, Zap } from 'lucide-react'
import { Button } from './ui/button'
import RatingBadge from './RatingBadge'
import useAddToCart from '../hooks/useAddToCart'
import { formatPrice, getCategory, getMrp, isOutOfStock } from '../lib/catalog'

const ProductDesc = ({ product }) => {
  const navigate = useNavigate()
  const { addToCart, addingId } = useAddToCart()
  const mrp = getMrp(product)
  const soldOut = isOutOfStock(product)
  const adding = addingId === product._id
  const lowStock = product.stock > 0 && product.stock <= 10

  const buyNow = async () => {
    if (await addToCart(product._id)) navigate('/cart')
  }

  return (
    <div className='flex flex-col gap-4'>
      <div>
        <p className='text-sm font-semibold uppercase tracking-wider text-pink-600'>{product.brand}</p>
        <h1 className='mt-1 text-2xl font-bold leading-snug text-gray-900 wrap-break-word sm:text-3xl'>{product.productName}</h1>
        <div className='mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500'>
          <RatingBadge rating={product.rating} />
          <span>{getCategory(product).name}</span>
        </div>
      </div>

      <div className='rounded-xl bg-gray-50 p-4'>
        {product.discountPercentage > 0 && (
          <span className='text-sm font-semibold text-green-600'>Special price</span>
        )}
        <div className='flex flex-wrap items-baseline gap-x-3'>
          <span className='text-3xl font-extrabold text-gray-900'>{formatPrice(product.productPrice)}</span>
          {mrp && <span className='text-lg text-gray-400 line-through'>{formatPrice(mrp)}</span>}
          {product.discountPercentage > 0 && (
            <span className='text-lg font-bold text-green-600'>{product.discountPercentage}% off</span>
          )}
        </div>
        <p className='mt-1 text-xs text-gray-500'>Inclusive of all taxes</p>
        {soldOut ? (
          <p className='mt-2 text-sm font-semibold text-red-600'>Currently out of stock</p>
        ) : lowStock ? (
          <p className='mt-2 text-sm font-semibold text-amber-600'>Hurry, only {product.stock} left!</p>
        ) : (
          <p className='mt-2 text-sm font-semibold text-green-600'>In stock</p>
        )}
      </div>

      <div className='flex flex-col gap-3 sm:flex-row'>
        <Button
          onClick={() => addToCart(product._id)}
          disabled={soldOut || adding}
          variant='outline'
          className='h-12 flex-1 cursor-pointer border-2 border-pink-600 text-base font-bold text-pink-600 hover:bg-pink-50 hover:text-pink-700'
        >
          {adding ? <Loader2 className='animate-spin' /> : <ShoppingCart />} Add to Cart
        </Button>
        <Button
          onClick={buyNow}
          disabled={soldOut || adding}
          className='h-12 flex-1 cursor-pointer bg-pink-600 text-base font-bold hover:bg-pink-700'
        >
          <Zap /> Buy Now
        </Button>
      </div>

      <div className='grid grid-cols-3 gap-2 border-y border-gray-100 py-4 text-center text-xs text-gray-600'>
        <div className='flex flex-col items-center gap-1'>
          <Truck className='h-5 w-5 text-pink-600' /> Free delivery above ₹299
        </div>
        <div className='flex flex-col items-center gap-1'>
          <RotateCcw className='h-5 w-5 text-pink-600' /> 30-day returns
        </div>
        <div className='flex flex-col items-center gap-1'>
          <ShieldCheck className='h-5 w-5 text-pink-600' /> Secure payment
        </div>
      </div>

      <div>
        <h2 className='mb-2 text-lg font-bold text-gray-900'>Product Description</h2>
        <p className='whitespace-pre-line leading-relaxed text-gray-600 wrap-break-word'>{product.productDesc}</p>
      </div>
    </div>
  )
}

export default ProductDesc

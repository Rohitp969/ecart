import React from 'react'
import Breadkrums from '../components/Breadkrums'
import ProductImg from '../components/ProductImg'
import ProductDesc from '../components/ProductDesc'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import store from '../redux/store'

const SingleProduct = () => {
  const params = useParams()
  const productId = params.id 
  const {products} = useSelector(store => store.product)
  const product = products.find((item) => item._id === productId)
  if (!product) {
    return <div className="pt-20 text-center">Loading...</div>;
  }
  return (
    <div className='pt-20 pb-10 max-w-7xl mx-auto px-4'>
      <Breadkrums product={product}/>
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <ProductImg images={product.productImg}/>
        <ProductDesc product={product}/>
      </div>
    </div>
  )
}

export default SingleProduct

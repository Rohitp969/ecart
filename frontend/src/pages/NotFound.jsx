import React from 'react'
import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'

const NotFound = () => (
  <main className='flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 pt-24 pb-12'>
    <div className='w-full max-w-md text-center'>
      <SearchX className='mx-auto h-16 w-16 text-gray-300' />
      <p className='mt-4 text-sm font-bold uppercase tracking-wider text-pink-600'>Error 404</p>
      <h1 className='mt-1 text-3xl font-bold text-gray-900'>Page not found</h1>
      <p className='mt-2 text-sm text-gray-600'>The page you're looking for doesn't exist or has been moved.</p>
      <div className='mt-6 flex flex-wrap justify-center gap-3'>
        <Link to='/' className='rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700'>
          Go home
        </Link>
        <Link to='/products' className='rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'>
          Browse products
        </Link>
      </div>
    </div>
  </main>
)

export default NotFound

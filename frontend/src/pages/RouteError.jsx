import React from 'react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import NotFound from './NotFound'

// Router-level fallback: 404s get the normal page, crashes get a friendly retry screen
const RouteError = () => {
  const error = useRouteError()
  console.error(error)

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />

  return (
    <main className='flex min-h-screen items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md text-center'>
        <TriangleAlert className='mx-auto h-14 w-14 text-amber-500' />
        <h1 className='mt-4 text-2xl font-bold text-gray-900'>Something went wrong</h1>
        <p className='mt-2 text-sm text-gray-600'>An unexpected error occurred while loading this page.</p>
        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          <button
            onClick={() => window.location.reload()}
            className='cursor-pointer rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700'
          >
            Try again
          </button>
          <Link to='/' className='rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'>
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}

export default RouteError

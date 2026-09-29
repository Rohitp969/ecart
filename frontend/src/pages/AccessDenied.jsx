import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ShieldAlert } from 'lucide-react'
import useLogout from '../hooks/useLogout'

// Shown when a signed-in customer opens an admin-only page
const AccessDenied = () => {
  const { user } = useSelector((store) => store.user)
  const logout = useLogout()

  return (
    <main className='flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 pt-24 pb-12'>
      <div className='w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8'>
        <span className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600'>
          <ShieldAlert className='h-7 w-7' />
        </span>
        <h1 className='mt-4 text-2xl font-bold text-gray-900'>Admins only</h1>
        <p className='mt-2 text-sm text-gray-600'>
          The admin panel is only available to store administrators. You're signed in as{' '}
          <span className='font-semibold break-all text-gray-900'>{user?.email}</span>, which is a customer account.
        </p>
        <div className='mt-6 flex flex-col gap-3 sm:flex-row'>
          <Link
            to='/'
            className='flex-1 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700'
          >
            Continue shopping
          </Link>
          {/* stay here: the admin guard then sends us to login, and back to this admin page */}
          <button
            onClick={() => logout({ redirectTo: null })}
            className='flex-1 cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50'
          >
            Sign in as admin
          </button>
        </div>
      </div>
    </main>
  )
}

export default AccessDenied

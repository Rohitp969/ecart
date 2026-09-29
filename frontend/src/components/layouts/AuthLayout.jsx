import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft, Banknote, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { FREE_SHIPPING_ABOVE, RETURN_WINDOW_DAYS } from '../../lib/help'

const PERKS = [
  { icon: Truck, text: `Free delivery on orders above ₹${FREE_SHIPPING_ABOVE}` },
  { icon: ShieldCheck, text: 'Secure payments with Razorpay' },
  { icon: Banknote, text: 'Cash on Delivery available' },
  { icon: RotateCcw, text: `${RETURN_WINDOW_DAYS}-day easy returns` },
]

// Login, signup, verification and password pages: a brand panel on large screens, just the form on phones
const AuthLayout = () => (
  <div className='min-h-screen bg-gray-50 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]'>
    <aside className='relative hidden overflow-hidden bg-linear-to-br from-pink-600 via-rose-500 to-orange-400 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14'>
      <div className='absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10' />
      <div className='absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10' />

      <Link to='/' className='relative inline-flex w-fit rounded-2xl bg-white px-4 py-2.5 shadow-sm'>
        <img src='/Ekart-logo.png' alt='Ekart' className='w-28' />
      </Link>

      <div className='relative max-w-md'>
        <h2 className='text-3xl font-bold leading-tight xl:text-4xl'>Everything you love, delivered to your door.</h2>
        <p className='mt-3 text-pink-50'>Electronics, fashion, home, beauty and more — at prices you'll love.</p>
        <ul className='mt-8 space-y-4'>
          {PERKS.map((perk) => (
            <li key={perk.text} className='flex items-center gap-3 font-medium'>
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15'>
                <perk.icon className='h-5 w-5' />
              </span>
              {perk.text}
            </li>
          ))}
        </ul>
      </div>

      <p className='relative text-sm text-pink-50/80'>© {new Date().getFullYear()} Ekart. All rights reserved.</p>
    </aside>

    <div className='flex min-h-screen flex-col'>
      <header className='flex items-center justify-between gap-4 px-4 py-4 sm:px-8'>
        <Link to='/' className='lg:invisible'>
          <img src='/Ekart-logo.png' alt='Ekart' className='w-24 sm:w-28' />
        </Link>
        <Link to='/' className='flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-pink-600'>
          <ArrowLeft className='h-4 w-4' /> Back to store
        </Link>
      </header>
      <main className='flex flex-1 items-center justify-center px-4 pb-10 pt-2 sm:px-8'>
        <Outlet />
      </main>
    </div>
  </div>
)

export default AuthLayout

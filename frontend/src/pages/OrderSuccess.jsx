import React from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { Banknote, CheckCircle2, CreditCard, PackageSearch } from 'lucide-react'
import { shortId } from '../lib/admin'
import { formatMoney } from '../lib/orders'

// Shown after checkout; the order details come from navigation state (absent on a page refresh)
const OrderSuccess = () => {
  const { user } = useSelector((store) => store.user)
  const { state } = useLocation()
  const isCod = state?.paymentMethod === 'COD'
  const orderRef = state?.orderId ? shortId(state.orderId) : null

  return (
    <main className='flex min-h-screen items-center justify-center bg-gray-50 px-4 pt-24 pb-12'>
      <div className='w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm'>
        <span className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50'>
          <CheckCircle2 className='h-12 w-12 text-green-500' />
        </span>

        <h1 className='mt-5 text-2xl font-bold text-gray-900'>{isCod ? 'Order placed!' : 'Payment successful!'}</h1>
        <p className='mt-2 text-sm text-gray-600'>
          Thank you for shopping with Ekart. We'll start packing your order right away.
        </p>

        {state?.orderId && (
          <dl className='mt-6 space-y-2 rounded-xl bg-gray-50 p-4 text-left text-sm'>
            <div className='flex justify-between'>
              <dt className='text-gray-500'>Order ID</dt>
              <dd className='font-mono font-bold text-gray-900'>{orderRef}</dd>
            </div>
            <div className='flex justify-between'>
              <dt className='text-gray-500'>Payment</dt>
              <dd className='flex items-center gap-1.5 font-medium text-gray-900'>
                {isCod ? <Banknote className='h-4 w-4 text-sky-600' /> : <CreditCard className='h-4 w-4 text-green-600' />}
                {isCod ? 'Cash on Delivery' : 'Paid online'}
              </dd>
            </div>
            <div className='flex justify-between'>
              <dt className='text-gray-500'>{isCod ? 'Pay on delivery' : 'Amount paid'}</dt>
              <dd className='font-bold text-gray-900'>{formatMoney(state.amount)}</dd>
            </div>
          </dl>
        )}
        {isCod && (
          <p className='mt-3 text-xs text-gray-500'>Keep the amount ready in cash or UPI when the delivery arrives.</p>
        )}

        <div className='mt-6 flex flex-col gap-3'>
          <Link
            to={`/profile/${user?._id}?tab=orders`}
            className='rounded-xl bg-pink-600 py-3 text-sm font-semibold text-white transition hover:bg-pink-700'
          >
            View my orders
          </Link>
          {orderRef && (
            <Link
              to={`/track-order?id=${encodeURIComponent(orderRef)}`}
              className='inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50'
            >
              <PackageSearch className='h-4 w-4' /> Track this order
            </Link>
          )}
          <Link to='/products' className='py-2 text-sm font-semibold text-pink-600 hover:underline'>
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  )
}

export default OrderSuccess

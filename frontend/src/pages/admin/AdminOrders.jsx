import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Eye, Search } from 'lucide-react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import OrderDetailsDialog, { FulfilmentSelect } from '@/components/admin/OrderDetailsDialog'
import { PaymentBadge } from '@/components/admin/StatusBadge'
import Pagination from '@/components/Pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { API_URL, ORDER_STATUSES, PAYMENT_STATUSES, authConfig, formatDate, fullName, saveOrderStatus, shortId } from '@/lib/admin'
import { formatPrice } from '@/lib/catalog'

const PAGE_SIZE = 15
const SORTS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  amount_desc: (a, b) => b.amount - a.amount,
  amount_asc: (a, b) => a.amount - b.amount,
}

const AdminOrders = () => {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [payment, setPayment] = useState('')
  const [fulfilment, setFulfilment] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    let ignore = false
    axios
      .get(`${API_URL}/api/v1/orders/all`, authConfig())
      .then((res) => !ignore && setOrders(res.data.orders))
      .catch((err) => !ignore && setError(err.response?.data?.message || 'Could not load orders'))
    return () => {
      ignore = true
    }
  }, [])

  const counts = useMemo(() => {
    const result = { '': orders?.length || 0 }
    for (const o of orders || []) result[o.status] = (result[o.status] || 0) + 1
    return result
  }, [orders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (orders || [])
      .filter(
        (o) =>
          (!payment || o.status === payment) &&
          (!fulfilment || (o.orderStatus || 'Processing') === fulfilment) &&
          (!q ||
            `${o._id} ${shortId(o._id)} ${fullName(o.user)} ${o.user?.email || ''} ${o.shippingAddress?.fullName || ''}`
              .toLowerCase()
              .includes(q)),
      )
      .sort(SORTS[sort])
  }, [orders, payment, fulfilment, search, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const withReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const changeStatus = async (order, orderStatus) => {
    setUpdatingId(order._id)
    const updated = await saveOrderStatus(order._id, orderStatus)
    if (updated) setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)))
    setUpdatingId(null)
  }

  const selected = orders?.find((o) => o._id === selectedId)
  // phones: selects fill the row two-up under the search box; from sm they keep their natural width
  const selectClass = 'min-w-0 grow basis-32 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-pink-500 sm:grow-0 sm:basis-auto'

  return (
    <div>
      <AdminPageHeader title='Orders' description='Track payments and move orders from processing to delivery' />

      {/* 2×2 grid on phones so every status stays visible; a single row from sm */}
      <div className='mb-4 grid grid-cols-2 gap-1 rounded-xl border border-gray-100 bg-white p-1 shadow-sm sm:flex sm:overflow-x-auto sm:[scrollbar-width:none]'>
        {['', ...PAYMENT_STATUSES].map((status) => (
          <button
            key={status || 'all'}
            onClick={() => withReset(setPayment)(status)}
            className={`flex min-w-0 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:justify-start sm:px-4 ${
              payment === status ? 'bg-pink-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status || 'All orders'}
            <span className={`rounded-full px-1.5 text-xs ${payment === status ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
              {counts[status] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className='rounded-2xl border border-gray-100 bg-white shadow-sm'>
        <div className='flex flex-wrap items-center gap-3 border-b border-gray-100 p-4'>
          <div className='relative min-w-52 flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              value={search}
              onChange={(e) => withReset(setSearch)(e.target.value)}
              placeholder='Search by order ID, customer or email'
              className='w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500'
            />
          </div>
          <select value={fulfilment} onChange={(e) => withReset(setFulfilment)(e.target.value)} className={selectClass} aria-label='Fulfilment'>
            <option value=''>Any fulfilment</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass} aria-label='Sort'>
            <option value='newest'>Newest first</option>
            <option value='oldest'>Oldest first</option>
            <option value='amount_desc'>Amount: high to low</option>
            <option value='amount_asc'>Amount: low to high</option>
          </select>
        </div>

        {error ? (
          <p className='p-6 text-sm text-red-600'>{error}</p>
        ) : (
          <>
            {/* phones: stacked cards */}
            <ul className='divide-y divide-gray-100 md:hidden'>
              {!orders
                ? Array.from({ length: 4 }, (_, i) => (
                    <li key={i} className='p-4'><Skeleton className='h-28 w-full' /></li>
                  ))
                : rows.map((order) => {
                    const units = order.products.reduce((sum, p) => sum + p.quantity, 0)
                    const firstImage = order.products[0]?.productId?.productImg?.[0]?.url
                    return (
                      <li key={order._id} className='space-y-3 p-4'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <button onClick={() => setSelectedId(order._id)} className='cursor-pointer font-mono text-sm font-bold text-gray-900 hover:text-pink-600'>
                              {shortId(order._id)}
                            </button>
                            <p className='text-xs text-gray-500'>{formatDate(order.createdAt, true)}</p>
                          </div>
                          <div className='flex shrink-0 flex-col items-end gap-1'>
                            <span className='font-semibold tabular-nums text-gray-900'>{formatPrice(order.amount)}</span>
                            <PaymentBadge status={order.status} method={order.paymentMethod} />
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50'>
                            {firstImage && <img src={firstImage} alt='' className='h-full w-full object-contain p-0.5 mix-blend-multiply' />}
                          </div>
                          <div className='min-w-0 flex-1 text-sm'>
                            {order.user?._id ? (
                              <Link to={`/dashboard/users/${order.user._id}`} className='block truncate font-medium text-gray-900 hover:text-pink-600'>
                                {fullName(order.user)}
                              </Link>
                            ) : (
                              <span className='text-gray-500'>Deleted user</span>
                            )}
                            <p className='truncate text-xs text-gray-500'>{order.user?.email}</p>
                          </div>
                          <span className='shrink-0 text-xs text-gray-500'>{units} item{units === 1 ? '' : 's'}</span>
                        </div>
                        <div className='flex items-center gap-2 sm:justify-end'>
                          <FulfilmentSelect
                            order={order}
                            onChange={changeStatus}
                            disabled={updatingId === order._id}
                            className='min-w-0 flex-1 py-2 text-sm sm:flex-none'
                          />
                          <button
                            onClick={() => setSelectedId(order._id)}
                            className='inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50'
                          >
                            <Eye className='h-4 w-4' /> View
                          </button>
                        </div>
                      </li>
                    )
                  })}
            </ul>

            {/* md+: table; below xl the Items and Payment columns fold into Order / Total so it fits beside the sidebar */}
            <div className='hidden overflow-x-auto md:block'>
              <table className='w-full text-sm'>
                <thead className='bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500'>
                  <tr>
                    <th className='px-4 py-3 font-semibold'>Order</th>
                    <th className='px-3 py-3 font-semibold'>Customer</th>
                    <th className='hidden px-3 py-3 font-semibold xl:table-cell'>Items</th>
                    <th className='px-3 py-3 text-right font-semibold'>Total</th>
                    <th className='hidden px-3 py-3 font-semibold xl:table-cell'>Payment</th>
                    <th className='px-3 py-3 font-semibold'>Fulfilment</th>
                    <th className='px-4 py-3 text-right font-semibold'>Details</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {!orders
                    ? Array.from({ length: 6 }, (_, i) => (
                        <tr key={i}><td colSpan={7} className='px-4 py-3'><Skeleton className='h-10 w-full' /></td></tr>
                      ))
                    : rows.map((order) => {
                        const units = order.products.reduce((sum, p) => sum + p.quantity, 0)
                        const firstImage = order.products[0]?.productId?.productImg?.[0]?.url
                        return (
                          <tr key={order._id} className='hover:bg-gray-50'>
                            <td className='px-4 py-3'>
                              <button onClick={() => setSelectedId(order._id)} className='cursor-pointer font-mono text-xs font-bold text-gray-900 hover:text-pink-600'>
                                {shortId(order._id)}
                              </button>
                              <p className='text-xs text-gray-500'>{formatDate(order.createdAt, true)}</p>
                              <p className='text-xs text-gray-500 xl:hidden'>{units} item{units === 1 ? '' : 's'}</p>
                            </td>
                            <td className='px-3 py-3'>
                              {order.user?._id ? (
                                <Link to={`/dashboard/users/${order.user._id}`} className='font-medium text-gray-900 hover:text-pink-600'>
                                  {fullName(order.user)}
                                </Link>
                              ) : (
                                <span className='text-gray-500'>Deleted user</span>
                              )}
                              <p className='max-w-48 truncate text-xs text-gray-500' title={order.user?.email}>{order.user?.email}</p>
                            </td>
                            <td className='hidden px-3 py-3 xl:table-cell'>
                              <div className='flex items-center gap-2'>
                                <div className='h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-50'>
                                  {firstImage && <img src={firstImage} alt='' className='h-full w-full object-contain p-0.5 mix-blend-multiply' />}
                                </div>
                                <span className='text-gray-600'>{units} item{units === 1 ? '' : 's'}</span>
                              </div>
                            </td>
                            <td className='px-3 py-3 text-right'>
                              <p className='font-semibold tabular-nums text-gray-900'>{formatPrice(order.amount)}</p>
                              <div className='mt-1 xl:hidden'><PaymentBadge status={order.status} method={order.paymentMethod} /></div>
                            </td>
                            <td className='hidden px-3 py-3 xl:table-cell'><PaymentBadge status={order.status} method={order.paymentMethod} /></td>
                            <td className='px-3 py-3'>
                              <FulfilmentSelect order={order} onChange={changeStatus} disabled={updatingId === order._id} />
                            </td>
                            <td className='px-4 py-3 text-right'>
                              <button
                                onClick={() => setSelectedId(order._id)}
                                className='inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50'
                              >
                                <Eye className='h-3.5 w-3.5' /> View
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>
            {orders && rows.length === 0 && <p className='px-4 py-12 text-center text-sm text-gray-500'>No orders match these filters.</p>}
          </>
        )}

        <div className='flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3'>
          <p className='text-sm text-gray-500'>
            {filtered.length
              ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`
              : '0 orders'}
          </p>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      <OrderDetailsDialog order={selected} onClose={() => setSelectedId(null)} onStatusChange={changeStatus} />
    </div>
  )
}

export default AdminOrders

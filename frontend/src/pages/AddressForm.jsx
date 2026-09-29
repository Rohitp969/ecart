import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Banknote,
  Check,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
} from 'lucide-react'
import { setCart } from '../redux/productSlice'
import { formatPrice } from '../lib/catalog'
import { FREE_SHIPPING_ABOVE, RETURN_WINDOW_DAYS } from '../lib/help'
import { checkoutTotals, formatMoney } from '../lib/orders'
import { addressFromProfile, addressLine, addressToForm } from '../lib/address'
import CheckoutSteps from '../components/CheckoutSteps'
import AddressEditor from '../components/AddressEditor'
import { Skeleton } from '../components/ui/skeleton'
import useAddresses from '../hooks/useAddresses'

// ─── Constants ───────────────────────────────────────────────────────────────
const PAYMENT_OPTIONS = [
  {
    value: 'Online',
    label: 'Pay online',
    description: 'UPI, credit/debit cards, net banking & wallets via Razorpay',
    icon: CreditCard,
  },
  {
    value: 'COD',
    label: 'Cash on Delivery',
    description: 'Pay with cash or UPI when your order arrives',
    icon: Banknote,
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────
const AddressForm = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { user } = useSelector((store) => store.user)
  const { cart } = useSelector((store) => store.product)
  const items = cart?.items || []

  // saved addresses come from the user's account, so they follow them across devices
  const { addresses, loading, saveAddress, removeAddress } = useAddresses()
  const [selectedId, setSelectedId] = useState(null)
  const [editor, setEditor] = useState(null) // null = closed, {} = new address, { id } = editing
  const [deletingId, setDeletingId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Online')

  // ── Derived state ───────────────────────────────────────────────────────────
  // (same totals the server uses when it creates the order)
  const { subtotal, shipping, tax, total, itemCount } = checkoutTotals(items)
  // picked address, else the default one, else the first
  const selected =
    addresses.find((a) => a._id === selectedId) || addresses.find((a) => a.isDefault) || addresses[0] || null
  const formOpen = editor !== null || (!loading && addresses.length === 0)
  const editing = editor?.id ? addresses.find((a) => a._id === editor.id) : null

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSaveAddress = async (address, { isDefault }) => {
    const res = await saveAddress(address, editor?.id, { isDefault })
    if (res) {
      setSelectedId(res.address._id)
      setEditor(null)
    }
  }

  const handleDeleteAddress = async (e, id) => {
    e.stopPropagation()
    setDeletingId(id)
    await removeAddress(id)
    setDeletingId(null)
    if (selectedId === id) setSelectedId(null)
  }

  const handleEditAddress = (e, id) => {
    e.stopPropagation()
    setEditor({ id })
  }

  const handlePayment = async () => {
    if (!selected) {
      toast.error('Please select a delivery address.')
      return
    }

    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      toast.error('You must be logged in to place an order.')
      navigate('/login')
      return
    }

    if (!items.length) {
      toast.error('Your cart is empty.')
      return
    }

    setIsProcessing(true)

    try {
      // the server works out the amount from the cart; we only send the address and payment choice
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/orders/create-order`,
        { shippingAddress: selected, paymentMethod },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (!data.success) {
        toast.error('Failed to create order. Please try again.')
        setIsProcessing(false)
        return
      }

      const placedOrder = { orderId: data.dbOrder._id, paymentMethod, amount: data.dbOrder.amount }

      // Cash on delivery: nothing to pay now, the order is already placed
      if (paymentMethod === 'COD') {
        toast.success('Order placed!')
        dispatch(setCart({ items: [], totalPrice: 0 }))
        navigate('/order-success', { state: placedOrder })
        return
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: 'Ekart',
        description: 'Order Payment',

        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_API_URL}/api/v1/orders/verify-payment`,
              response,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            )
            if (verifyRes.data.success) {
              toast.success('Payment successful!')
              dispatch(setCart({ items: [], totalPrice: 0 }))
              navigate('/order-success', { state: placedOrder })
            } else {
              toast.error('Payment verification failed. Contact support.')
            }
          } catch {
            toast.error('Error verifying payment. Please contact support.')
          } finally {
            setIsProcessing(false)
          }
        },

        modal: {
          ondismiss: async function () {
            try {
              await axios.post(
                `${import.meta.env.VITE_API_URL}/api/v1/orders/verify-payment`,
                { razorpay_order_id: data.order.id, paymentFailed: true },
                { headers: { Authorization: `Bearer ${accessToken}` } }
              )
            } catch {
              // Silently log — user already sees toast
            }
            toast.error('Payment cancelled.')
            setIsProcessing(false)
          },
        },

        prefill: {
          name: selected.fullName,
          email: selected.email,
          contact: selected.phone,
        },

        theme: { color: '#DB2777' },
      }

      const rzp = new window.Razorpay(options)

      rzp.on('payment.failed', async function () {
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/v1/orders/verify-payment`,
            { razorpay_order_id: data.order.id, paymentFailed: true },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
        } catch {
          // Silently log
        }
        toast.error('Payment failed. Please try again.')
        setIsProcessing(false)
      })

      rzp.open()
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Something went wrong while processing payment.'
      toast.error(message)
      setIsProcessing(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!items.length) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 pt-24 pb-12">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <ShoppingCart className="mx-auto h-14 w-14 text-gray-300" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Your cart is empty</h1>
          <p className="mt-2 text-sm text-gray-600">Add some products to your cart before checking out.</p>
          <Link
            to="/products"
            className="mt-6 inline-block rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
          >
            Browse products
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-12 md:pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <CheckoutSteps current={1} />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ── Left: Address section ── */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : formOpen ? (
              <AddressEditor
                key={editor?.id || 'new'}
                initial={editing ? addressToForm(editing) : addressFromProfile(user, addresses.length === 0)}
                title={editing ? 'Edit address' : addresses.length > 0 ? 'Add a new address' : 'Delivery address'}
                subtitle="Where should we deliver your order? It's saved to your account for next time."
                submitLabel={editing ? 'Save changes' : 'Save address & continue'}
                onSubmit={handleSaveAddress}
                onCancel={addresses.length > 0 ? () => setEditor(null) : undefined}
                showDefaultOption={addresses.length > 0}
                defaultChecked={!!editing?.isDefault}
              />
            ) : (
              <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <h1 className="text-xl font-bold text-gray-900">Select delivery address</h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditor({})}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700"
                  >
                    <Plus className="h-4 w-4" /> Add new
                  </button>
                </div>

                <div role="radiogroup" aria-label="Delivery address" className="space-y-3">
                  {addresses.map((addr) => {
                    const isSelected = selected?._id === addr._id
                    return (
                      <div
                        key={addr._id}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => setSelectedId(addr._id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedId(addr._id)
                          }
                        }}
                        className={`flex cursor-pointer gap-3 rounded-xl border p-4 outline-none transition focus-visible:ring-2 focus-visible:ring-pink-300 ${
                          isSelected ? 'border-pink-500 bg-pink-50/60 ring-1 ring-pink-500' : 'border-gray-200 hover:border-gray-300'
                        } ${deletingId === addr._id ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected ? 'border-pink-600' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-pink-600" />}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-x-2 font-semibold text-gray-900">
                            {addr.fullName}
                            <span className="text-sm font-normal text-gray-500">{addr.phone}</span>
                            {addr.isDefault && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">{addressLine(addr)}</p>
                          {addr.email && <p className="text-sm text-gray-500">{addr.email}</p>}

                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleEditAddress(e, addr._id)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(e, addr._id)}
                              disabled={deletingId === addr._id}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === addr._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!selected && (
                  <p className="mt-4 flex items-center gap-2 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4" /> Please select an address to continue.
                  </p>
                )}

                {/* ── Payment method ── */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h2 className="mb-4 text-lg font-bold text-gray-900">Payment method</h2>
                  <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
                    {PAYMENT_OPTIONS.map((option) => {
                      const isChosen = paymentMethod === option.value
                      return (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition has-focus-visible:ring-2 has-focus-visible:ring-pink-300 ${
                            isChosen ? 'border-pink-500 bg-pink-50/60 ring-1 ring-pink-500' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={option.value}
                            checked={isChosen}
                            onChange={() => setPaymentMethod(option.value)}
                            className="sr-only"
                          />
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              isChosen ? 'border-pink-600' : 'border-gray-300'
                            }`}
                          >
                            {isChosen && <span className="h-2.5 w-2.5 rounded-full bg-pink-600" />}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 font-semibold text-gray-900">
                              <option.icon className="h-4 w-4 text-pink-600" /> {option.label}
                            </span>
                            <span className="mt-0.5 block text-xs text-gray-500">{option.description}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  {paymentMethod === 'COD' && (
                    <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
                      Keep {formatMoney(total)} ready in cash or UPI. You can cancel anytime before the order ships.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!selected || isProcessing}
                  onClick={handlePayment}
                  className="mt-5 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-pink-600 px-6 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : paymentMethod === 'COD' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {isProcessing
                    ? 'Processing…'
                    : paymentMethod === 'COD'
                      ? `Place order · ${formatMoney(total)}`
                      : `Pay ${formatMoney(total)}`}
                </button>
              </div>
            )}
          </section>

          {/* ── Right: Order summary ── */}
          <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-28">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

            <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {items.map((item, i) => {
                const product = item.productId
                return (
                  <li key={product?._id || i} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 rounded-lg border border-gray-100 bg-gray-50">
                      {product?.productImg?.[0]?.url && (
                        <img src={product.productImg[0].url} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
                      )}
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-700 px-1 text-[11px] font-bold text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <p className="line-clamp-2 min-w-0 flex-1 text-sm text-gray-700">{product?.productName ?? 'Product'}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice((product?.productPrice ?? 0) * item.quantity)}
                    </p>
                  </li>
                )
              })}
            </ul>

            <dl className="mt-4 space-y-2.5 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">
                  Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
                </dt>
                <dd className="text-gray-900">{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Shipping</dt>
                <dd className={shipping === 0 ? 'font-semibold text-green-600' : 'text-gray-900'}>
                  {shipping === 0 ? 'FREE' : formatMoney(shipping)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Tax (5%)</dt>
                <dd className="text-gray-900">{formatMoney(tax)}</dd>
              </div>
            </dl>

            {shipping > 0 && (
              <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Add {formatMoney(FREE_SHIPPING_ABOVE - subtotal + 1)} more to get FREE shipping.
              </p>
            )}

            <div className="mt-4 flex items-baseline justify-between border-t border-gray-100 pt-4">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">{formatMoney(total)}</span>
            </div>

            <ul className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" /> Free shipping on orders above ₹{FREE_SHIPPING_ABOVE}
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-amber-600" /> {RETURN_WINDOW_DAYS}-day hassle-free returns
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" /> 100% secure payments via Razorpay
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default AddressForm

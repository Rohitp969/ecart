import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Label } from "@/components/ui/label"
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { addAddress, deleteAddress, setSelectedAddress, setCart } from '../redux/productSlice'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import axios from 'axios'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

// ─── Constants ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+]?[\d\s\-()]{7,15}$/

// ─── Validation ───────────────────────────────────────────────────────────────
function validateForm(data) {
  const errors = {}

  if (!data.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required.'
  } else if (!PHONE_RE.test(data.phone)) {
    errors.phone = 'Enter a valid phone number.'
  }
  if (!data.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_RE.test(data.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!data.address.trim()) errors.address = 'Address is required.'
  if (!data.city.trim()) errors.city = 'City is required.'
  if (!data.state.trim()) errors.state = 'State is required.'
  if (!data.zip.trim()) errors.zip = 'ZIP code is required.'
  if (!data.country.trim()) errors.country = 'Country is required.'

  return errors
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldError({ message }) {
  if (!message) return null
  return <p className="text-xs text-red-500 mt-1">{message}</p>
}

function FormField({ label, id, name, placeholder, value, onChange, error, type = 'text' }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={error ? 'border-red-500 focus-visible:ring-red-400' : ''}
        autoComplete={name}
      />
      <FieldError message={error} />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AddressForm = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { cart, addresses, selectedAddress } = useSelector((store) => store.product)

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors, setErrors]     = useState({})
  const [showForm, setShowForm] = useState(addresses?.length === 0)
  const [isProcessing, setIsProcessing] = useState(false)

  // ── Derived totals ──────────────────────────────────────────────────────────
  const subtotal = cart.totalPrice ?? 0
  const shipping  = subtotal > 299 ? 0 : 49           // updated threshold to match UI note (₹299)
  const tax       = parseFloat((subtotal * 0.05).toFixed(2))
  const total     = subtotal + shipping + tax

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear the error for this field on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSave = () => {
    const validationErrors = validateForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('Please fix the errors before saving.')
      return
    }

    dispatch(addAddress(formData))
    // Auto-select the newly added address (index = length before push)
    dispatch(setSelectedAddress(addresses.length))
    setFormData(EMPTY_FORM)
    setErrors({})
    setShowForm(false)
    toast.success('Address saved!')
  }

  const handleSelectAddress = (index) => {
    dispatch(setSelectedAddress(index))
  }

  const handleDeleteAddress = (e, index) => {
    e.stopPropagation()
    dispatch(deleteAddress(index))

    // If the deleted address was selected, clear selection
    if (selectedAddress === index) {
      dispatch(setSelectedAddress(null))
    } else if (selectedAddress > index) {
      // Shift selected index down if needed
      dispatch(setSelectedAddress(selectedAddress - 1))
    }
  }

  const handleAddNew = () => {
    setFormData(EMPTY_FORM)
    setErrors({})
    setShowForm(true)
  }

  const handlePayment = async () => {
    if (selectedAddress === null || selectedAddress === undefined) {
      toast.error('Please select a delivery address.')
      return
    }

    const selected = addresses[selectedAddress]
    if (!selected) {
      toast.error('Selected address not found. Please try again.')
      return
    }

    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      toast.error('You must be logged in to place an order.')
      navigate('/login')
      return
    }

    if (!cart?.items?.length) {
      toast.error('Your cart is empty.')
      return
    }

    setIsProcessing(true)

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_URL}/api/v1/orders/create-order`,
        {
          product: cart.items.map((item) => ({
            productId: item.productId._id,
            quantity: item.quantity,
          })),
          tax,
          shipping,
          amount: total,
          currency: 'INR',
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (!data.success) {
        toast.error('Failed to create order. Please try again.')
        setIsProcessing(false)
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
              `${import.meta.env.VITE_URL}/api/v1/orders/verify-payment`,
              response,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            )
            if (verifyRes.data.success) {
              toast.success('✅ Payment successful!')
              dispatch(setCart({ items: [], totalPrice: 0 }))
              navigate('/order-success')
            } else {
              toast.error('❌ Payment verification failed. Contact support.')
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
                `${import.meta.env.VITE_URL}/api/v1/orders/verify-payment`,
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

        theme: { color: '#F472B6' },
      }

      const rzp = new window.Razorpay(options)

      rzp.on('payment.failed', async function (response) {
        try {
          await axios.post(
            `${import.meta.env.VITE_URL}/api/v1/orders/verify-payment`,
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
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-10 mt-10">

        {/* ── Left: Address section ── */}
        <div className="space-y-4 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          {showForm ? (
            <>
              <h2 className="text-lg font-semibold mb-2">
                {addresses.length > 0 ? 'Add New Address' : 'Delivery Address'}
              </h2>

              <FormField label="Full Name"     id="fullName" name="fullName" placeholder="John Doe"          value={formData.fullName} onChange={handleChange} error={errors.fullName} />
              <FormField label="Phone Number"  id="phone"    name="phone"    placeholder="+91 9876543210"    value={formData.phone}    onChange={handleChange} error={errors.phone} />
              <FormField label="Email"         id="email"    name="email"    placeholder="john@example.com"  value={formData.email}    onChange={handleChange} error={errors.email} type="email" />
              <FormField label="Address"       id="address"  name="address"  placeholder="123 Street, Area"  value={formData.address}  onChange={handleChange} error={errors.address} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="City"  id="city"  name="city"  placeholder="Mumbai"  value={formData.city}  onChange={handleChange} error={errors.city} />
                <FormField label="State" id="state" name="state" placeholder="Maharashtra" value={formData.state} onChange={handleChange} error={errors.state} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="ZIP Code" id="zip"     name="zip"     placeholder="400001" value={formData.zip}     onChange={handleChange} error={errors.zip} />
                <FormField label="Country"  id="country" name="country" placeholder="India"  value={formData.country} onChange={handleChange} error={errors.country} />
              </div>

              <div className="flex gap-3 pt-2">
                {addresses.length > 0 && (
                  <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                )}
                <Button className="flex-1" onClick={handleSave}>
                  Save &amp; Continue
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Select Delivery Address</h2>

              {addresses.map((addr, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectAddress(index)}
                  className={`border p-4 rounded-md cursor-pointer relative transition-colors
                    ${selectedAddress === index
                      ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-400'
                      : 'border-gray-200 hover:border-gray-400'
                    }`}
                >
                  {/* Selection indicator */}
                  <span
                    className={`absolute top-3 left-3 w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${selectedAddress === index ? 'border-pink-500 bg-pink-500' : 'border-gray-400'}`}
                  >
                    {selectedAddress === index && (
                      <span className="w-2 h-2 rounded-full bg-white block" />
                    )}
                  </span>

                  <div className="pl-7">
                    <p className="font-semibold">{addr.fullName}</p>
                    <p className="text-sm text-gray-600">{addr.phone}</p>
                    <p className="text-sm text-gray-600">{addr.email}</p>
                    <p className="text-sm text-gray-600">
                      {addr.address}, {addr.city}, {addr.state} – {addr.zip}, {addr.country}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDeleteAddress(e, index)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-xs font-medium"
                    aria-label="Delete address"
                  >
                    Delete
                  </button>
                </div>
              ))}

              <Button variant="outline" className="w-full" onClick={handleAddNew}>
                + Add New Address
              </Button>

              <Button
                disabled={selectedAddress === null || selectedAddress === undefined || isProcessing}
                onClick={handlePayment}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing…' : 'Proceed to Checkout'}
              </Button>

              {(selectedAddress === null || selectedAddress === undefined) && (
                <p className="text-xs text-center text-amber-600">
                  ⚠️ Please select an address to continue.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Order summary ── */}
        <div className="sticky top-24">
          <Card className="w-full max-w-[420px]">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Item list */}
              {cart.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="truncate max-w-[220px] text-gray-700">
                    {item.productId?.name ?? 'Product'} × {item.quantity}
                  </span>
                  <span>₹{((item.productId?.price ?? 0) * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}

              <Separator/>

              <div className="flex justify-between text-sm">
                <span>Subtotal ({cart.items.length} item{cart.items.length !== 1 ? 's' : ''})</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (5%)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>

              <div className="text-xs text-muted-foreground pt-3 space-y-1">
                <p>🚚 Free shipping on orders above ₹299</p>
                <p>↩️ 30-day hassle-free returns</p>
                <p>🔒 Secure checkout with SSL encryption</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}

export default AddressForm
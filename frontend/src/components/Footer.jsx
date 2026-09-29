import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { ArrowUp, CheckCircle2, Clock, Loader2, Mail, MapPin, Phone, Send, ShieldCheck } from 'lucide-react'
import { CATEGORY_GROUPS } from '../lib/catalog'
import { EMAIL_RE, HELP_PAGES, SOCIAL_LINKS, STORE_INFO } from '../lib/help'
import { API_URL } from '../lib/admin'
import { isAdmin } from '../lib/auth'

const PAYMENT_METHODS = ['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net Banking', 'Cash on Delivery']

// the layout scrolls up on page change; this also covers links that keep the path (/products?category=…)
const scrollTop = () => window.scrollTo({ top: 0 })

const FooterColumn = ({ title, children }) => (
  <div>
    <h3 className='mb-4 text-sm font-bold uppercase tracking-wider text-white'>{title}</h3>
    <ul className='space-y-2.5 text-sm'>{children}</ul>
  </div>
)

const FooterLink = ({ to, children }) => (
  <li>
    <Link to={to} onClick={scrollTop} className='text-gray-400 transition hover:text-pink-400'>
      {children}
    </Link>
  </li>
)

const Newsletter = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ state: 'idle', message: '' })
  const loading = status.state === 'loading'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setStatus({ state: 'error', message: 'Please enter a valid email address' })
      return
    }
    setStatus({ state: 'loading', message: '' })
    try {
      const res = await axios.post(`${API_URL}/api/v1/support/subscribe`, { email: value })
      setStatus({ state: 'success', message: res.data.message })
      setEmail('')
    } catch (error) {
      setStatus({
        state: 'error',
        message: error.response?.data?.message || 'Could not subscribe right now. Please try again.',
      })
    }
  }

  return (
    <div className='border-b border-white/10'>
      <div className='mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex items-start gap-4'>
          <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-500/15 text-pink-400'>
            <Mail className='h-6 w-6' />
          </span>
          <div>
            <h3 className='text-xl font-bold text-white'>Stay in the loop</h3>
            <p className='mt-1 text-sm text-gray-400'>
              Get exclusive deals, new arrivals and giveaways in your inbox. No spam, ever.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className='w-full lg:max-w-md'>
          <div className='flex rounded-full bg-white p-1 focus-within:ring-2 focus-within:ring-pink-500'>
            <label htmlFor='newsletter-email' className='sr-only'>
              Email address
            </label>
            <input
              id='newsletter-email'
              type='email'
              autoComplete='email'
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status.state === 'error') setStatus({ state: 'idle', message: '' })
              }}
              placeholder='Enter your email address'
              aria-invalid={status.state === 'error'}
              aria-describedby='newsletter-status'
              className='min-w-0 flex-1 bg-transparent px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400'
            />
            <button
              type='submit'
              disabled={loading}
              className='inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-70'
            >
              {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
              {loading ? 'Subscribing…' : 'Subscribe'}
            </button>
          </div>
          <p
            id='newsletter-status'
            aria-live='polite'
            className={`mt-2 flex min-h-5 items-center gap-1.5 px-4 text-sm ${
              status.state === 'error' ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {status.state === 'success' && <CheckCircle2 className='h-4 w-4 shrink-0' />}
            {status.message}
          </p>
        </form>
      </div>
    </div>
  )
}

const Footer = () => {
  const { user } = useSelector((store) => store.user)
  const helpLinks = HELP_PAGES.filter((page) => !page.legal)
  const legalLinks = HELP_PAGES.filter((page) => page.legal)

  return (
    <footer className='bg-gray-900 text-gray-300'>
      <Newsletter />

      {/* Brand + link columns */}
      <div className='mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 sm:grid-cols-3 lg:grid-cols-12'>
        <div className='col-span-2 sm:col-span-3 lg:col-span-4'>
          <Link to='/' onClick={scrollTop} className='inline-block'>
            <img src='/Ekart-logo.png' alt='Ekart' className='w-32' />
          </Link>
          <p className='mt-4 max-w-sm text-sm leading-6 text-gray-400'>{STORE_INFO.tagline}</p>

          <ul className='mt-5 space-y-3 text-sm'>
            <li className='flex gap-3'>
              <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-pink-400' />
              <span>{STORE_INFO.address}</span>
            </li>
            <li>
              <a href={`mailto:${STORE_INFO.email}`} className='flex gap-3 transition hover:text-pink-400'>
                <Mail className='mt-0.5 h-4 w-4 shrink-0 text-pink-400' />
                {STORE_INFO.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${STORE_INFO.phone.replace(/[^\d+]/g, '')}`}
                className='flex gap-3 transition hover:text-pink-400'
              >
                <Phone className='mt-0.5 h-4 w-4 shrink-0 text-pink-400' />
                {STORE_INFO.phone}
              </a>
            </li>
            <li className='flex gap-3'>
              <Clock className='mt-0.5 h-4 w-4 shrink-0 text-pink-400' />
              <span>{STORE_INFO.hours}</span>
            </li>
          </ul>

          <div className='mt-6 flex gap-3'>
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={`${STORE_INFO.name} on ${social.label}`}
                title={social.label}
                className='flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-300 ring-1 ring-white/10 transition hover:bg-pink-600 hover:text-white hover:ring-pink-600'
              >
                <social.icon className='h-4.5 w-4.5' />
              </a>
            ))}
          </div>
        </div>

        <div className='lg:col-span-2'>
          <FooterColumn title='Shop'>
            <FooterLink to='/products'>All Products</FooterLink>
            {CATEGORY_GROUPS.map((group) => (
              <FooterLink key={group.slug} to={`/products?category=${group.slug}`}>
                {group.name}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        <div className='lg:col-span-3'>
          <FooterColumn title='Customer Service'>
            {helpLinks.map((page) => (
              <FooterLink key={page.to} to={page.to}>
                {page.label}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        <div className='lg:col-span-3'>
          <FooterColumn title='My Account'>
            {user ? (
              <>
                <FooterLink to={`/profile/${user._id}`}>My Profile</FooterLink>
                <FooterLink to={`/profile/${user._id}?tab=orders`}>My Orders</FooterLink>
                <FooterLink to='/cart'>My Cart</FooterLink>
                {isAdmin(user) && <FooterLink to='/dashboard'>Admin Panel</FooterLink>}
              </>
            ) : (
              <>
                <FooterLink to='/login'>Sign In</FooterLink>
                <FooterLink to='/signup'>Create Account</FooterLink>
                <FooterLink to='/forgot-password'>Forgot Password</FooterLink>
              </>
            )}
          </FooterColumn>
        </div>
      </div>

      {/* Payments */}
      <div className='border-t border-white/10'>
        <div className='mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm sm:flex-row sm:items-center sm:justify-between'>
          <p className='flex items-center gap-2 text-gray-400'>
            <ShieldCheck className='h-4 w-4 text-green-400' />
            100% secure payments powered by Razorpay
          </p>
          <ul className='flex flex-wrap gap-2' aria-label='Accepted payment methods'>
            {PAYMENT_METHODS.map((method) => (
              <li
                key={method}
                className='rounded-md bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-300 ring-1 ring-white/10'
              >
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className='border-t border-white/10'>
        <div className='mx-auto flex max-w-7xl flex-col-reverse items-center gap-3 px-4 py-5 text-sm text-gray-400 sm:flex-row sm:justify-between'>
          <p>
            &copy; {new Date().getFullYear()} <span className='font-semibold text-pink-400'>{STORE_INFO.name}</span>. All
            rights reserved.
          </p>
          <nav className='flex flex-wrap items-center justify-center gap-x-5 gap-y-2'>
            {legalLinks.map((page) => (
              <Link key={page.to} to={page.to} onClick={scrollTop} className='transition hover:text-pink-400'>
                {page.label}
              </Link>
            ))}
            <button
              type='button'
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className='inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-gray-300 ring-1 ring-white/10 transition hover:bg-pink-600 hover:text-white hover:ring-pink-600'
            >
              <ArrowUp className='h-4 w-4' />
              Back to top
            </button>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer

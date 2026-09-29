import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { ExternalLink, Mail, MailCheck, RefreshCw } from 'lucide-react'
import { AuthCard, AuthField, Notice } from '@/components/auth/AuthUI'
import useCooldown from '../hooks/useCooldown'
import { EMAIL_RE, authErrorMessage } from '../lib/authFlow'

// "Check your inbox" after signup (or after trying to log in unverified)
const Verify = () => {
  const location = useLocation()
  const from = location.state?.from
  const [email, setEmail] = useState(location.state?.email || '')
  const knownEmail = Boolean(location.state?.email)
  // a mail was just sent, so start the resend cooldown straight away
  const [secondsLeft, startCooldown] = useCooldown(location.state?.justSent ? 60 : 0)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState(null)

  const resend = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setMessage({ tone: 'error', text: 'Enter the email you signed up with' })
      return
    }
    setSending(true)
    setMessage(null)
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/reVerify`, { email: email.trim() })
      setMessage({ tone: res.data.alreadyVerified ? 'info' : 'success', text: res.data.message })
      if (!res.data.alreadyVerified) {
        startCooldown(60)
        toast.success('Verification email sent')
      }
    } catch (error) {
      const retryAfter = error.response?.data?.retryAfter
      if (retryAfter) startCooldown(retryAfter)
      setMessage({ tone: 'error', text: authErrorMessage(error) })
    } finally {
      setSending(false)
    }
  }

  const isGmail = /@gmail\.com$/i.test(email.trim())

  return (
    <AuthCard
      icon={MailCheck}
      title='Check your inbox'
      subtitle={
        knownEmail ? (
          <>
            We've sent a verification link to <span className='font-semibold text-gray-900'>{email}</span>. Click the
            link in that email to activate your account.
          </>
        ) : (
          'We sent you a verification link. Click it to activate your account.'
        )
      }
      footer={
        <>
          Already verified?{' '}
          <Link to='/login' state={{ from, email }} className='font-semibold text-pink-600 hover:underline'>
            Log in
          </Link>
          <span className='mx-2 text-gray-300'>·</span>
          <Link to='/signup' state={{ from }} className='font-semibold text-pink-600 hover:underline'>
            Use a different email
          </Link>
        </>
      }
    >
      <div className='space-y-4'>
        <ul className='space-y-1.5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600'>
          <li>• The link is valid for 24 hours.</li>
          <li>• Can't find it? Check your spam or promotions folder.</li>
        </ul>

        {isGmail && (
          <a
            href='https://mail.google.com/mail/u/0/#search/from%3Aekart+OR+subject%3Averify'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-pink-600 px-5 text-sm font-semibold text-white transition hover:bg-pink-700'
          >
            <ExternalLink className='h-4 w-4' /> Open Gmail
          </a>
        )}

        {message && <Notice tone={message.tone}>{message.text}</Notice>}

        {!knownEmail && (
          <AuthField
            label='Your email'
            id='email'
            type='email'
            icon={Mail}
            autoComplete='email'
            placeholder='you@example.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        <button
          type='button'
          onClick={resend}
          disabled={sending || secondsLeft > 0}
          className='inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60'
        >
          <RefreshCw className={`h-4 w-4 ${sending ? 'animate-spin' : ''}`} />
          {secondsLeft > 0 ? `Resend email in ${secondsLeft}s` : sending ? 'Sending…' : 'Resend verification email'}
        </button>
      </div>
    </AuthCard>
  )
}

export default Verify

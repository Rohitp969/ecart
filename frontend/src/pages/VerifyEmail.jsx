import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react'
import { AuthCard, AuthField, Notice, SubmitButton } from '@/components/auth/AuthUI'
import useCooldown from '../hooks/useCooldown'
import { EMAIL_RE, authErrorMessage } from '../lib/authFlow'

const API = `${import.meta.env.VITE_API_URL}/api/v1/user`
const REDIRECT_SECONDS = 4

// Opened from the link in the verification email: /verify/:token
const VerifyEmail = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null) // null = verifying, { ok, message }
  const [secondsLeft, startCountdown] = useCooldown(0)

  // resend form (shown when the link is expired / invalid)
  const [email, setEmail] = useState('')
  const [resend, setResend] = useState({ loading: false, message: null })

  useEffect(() => {
    let ignore = false
    axios
      .post(`${API}/verify`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (ignore) return
        setResult({ ok: true, message: res.data.message })
        startCountdown(REDIRECT_SECONDS)
      })
      .catch((error) => !ignore && setResult({ ok: false, message: authErrorMessage(error, 'Verification failed. Please try again.') }))
    return () => {
      ignore = true
    }
    // startCountdown only schedules a timer; the request should run once per token
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // go to login when the countdown ends
  useEffect(() => {
    if (result?.ok && secondsLeft === 0) {
      const id = setTimeout(() => navigate('/login', { replace: true }), 300)
      return () => clearTimeout(id)
    }
    return undefined
  }, [result, secondsLeft, navigate])

  const requestNewLink = async (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) {
      setResend({ loading: false, message: { tone: 'error', text: 'Enter the email you signed up with' } })
      return
    }
    setResend({ loading: true, message: null })
    try {
      const res = await axios.post(`${API}/reVerify`, { email: email.trim() })
      setResend({ loading: false, message: { tone: res.data.alreadyVerified ? 'info' : 'success', text: res.data.message } })
    } catch (error) {
      setResend({ loading: false, message: { tone: 'error', text: authErrorMessage(error) } })
    }
  }

  if (!result) {
    return (
      <AuthCard icon={Mail} title='Verifying your email…' subtitle='This only takes a moment.'>
        <div className='flex justify-center py-4'>
          <Loader2 className='h-8 w-8 animate-spin text-pink-600' />
        </div>
      </AuthCard>
    )
  }

  if (result.ok) {
    return (
      <AuthCard icon={CheckCircle2} title='Email verified!' subtitle={result.message}>
        <Link
          to='/login'
          replace
          className='inline-flex h-11 w-full items-center justify-center rounded-lg bg-pink-600 px-5 text-sm font-semibold text-white transition hover:bg-pink-700'
        >
          Continue to log in
        </Link>
        <p className='mt-3 text-center text-xs text-gray-500' aria-live='polite'>
          Taking you to the login page{secondsLeft > 0 ? ` in ${secondsLeft}s` : '…'}
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      icon={XCircle}
      title="We couldn't verify your email"
      subtitle={result.message}
      footer={
        <Link to='/login' className='font-semibold text-pink-600 hover:underline'>
          Back to log in
        </Link>
      }
    >
      <form onSubmit={requestNewLink} noValidate className='space-y-4'>
        <p className='text-sm font-medium text-gray-700'>Get a new verification link</p>
        {resend.message && <Notice tone={resend.message.tone}>{resend.message.text}</Notice>}
        <AuthField
          label='Email'
          id='email'
          type='email'
          icon={Mail}
          autoComplete='email'
          placeholder='you@example.com'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <SubmitButton loading={resend.loading} loadingText='Sending…'>
          Send new link
        </SubmitButton>
      </form>
    </AuthCard>
  )
}

export default VerifyEmail

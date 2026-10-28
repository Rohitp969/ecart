import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { toast } from 'sonner'
import { Clock, ExternalLink, Mail, MailCheck, Pencil, RefreshCw } from 'lucide-react'
import { AuthCard, AuthField, Notice, OtpInput, SubmitButton } from '@/components/auth/AuthUI'
import useCooldown from '../hooks/useCooldown'
import { setUser } from '../redux/userSlice'
import { redirectAfterLogin } from '../lib/auth'
import { EMAIL_RE, authErrorMessage, clearVerifyState, codeTimers, readVerifyState, saveVerifyState, secondsUntil } from '../lib/authFlow'

const API = `${import.meta.env.VITE_API_URL}/api/v1/user`
const EMPTY_CODE = ['', '', '', '', '', '']

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

// Gmail opened on the right account (not whichever is signed in first), searching Spam too
const gmailSearch = (email) =>
  `https://mail.google.com/mail/?authuser=${encodeURIComponent(email)}#search/${encodeURIComponent('in:anywhere subject:"Ekart verification code"')}`

// Enter the 6-digit code emailed after signup (or after logging in with an unverified email).
// The right code verifies the email and signs the user in.
const Verify = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [session, setSession] = useState(readVerifyState)
  const { email = '', verifyToken, from } = session

  const [digits, setDigits] = useState(EMPTY_CODE)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(() =>
    session.emailFailed
      ? { tone: 'warning', text: "We couldn't send the code. Tap “Resend code” to try again." }
      : location.state?.notice
        ? { tone: 'info', text: location.state.notice }
        : null
  )
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendIn, startResendCooldown] = useCooldown(secondsUntil(session.resendAt))
  const [expiresIn, startExpiry] = useCooldown(secondsUntil(session.expiresAt))

  // "Change email" panel
  const [changing, setChanging] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [changeError, setChangeError] = useState('')
  const [changeLoading, setChangeLoading] = useState(false)
  // no email yet (page opened directly): ask for it first
  const [emailInput, setEmailInput] = useState('')

  const update = (patch) => setSession(saveVerifyState(patch))

  // a code just went out: restart both timers
  const codeWentOut = (data) => {
    const timers = codeTimers(data)
    update({ ...timers, emailFailed: false })
    startExpiry(secondsUntil(timers.expiresAt))
    startResendCooldown(secondsUntil(timers.resendAt))
    setDigits(EMPTY_CODE)
    setError('')
  }

  const toLogin = (message) => {
    clearVerifyState()
    toast.success(message)
    navigate('/login', { replace: true, state: { email, from } })
  }

  const verify = async (code) => {
    if (code.length !== 6) {
      setError('Enter all 6 digits of the code')
      return
    }
    setVerifying(true)
    setError('')
    try {
      const res = await axios.post(`${API}/verify-email`, { email, otp: code })
      if (res.data.alreadyVerified) return toLogin(res.data.message)
      // signed in: token first, so the page we land on can use it immediately
      localStorage.setItem('accessToken', res.data.accessToken)
      dispatch(setUser(res.data.user))
      clearVerifyState()
      toast.success(res.data.message)
      navigate(redirectAfterLogin(res.data.user, from), { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
      setDigits(EMPTY_CODE)
      if (err.response?.data?.expired) startExpiry(0)
    } finally {
      setVerifying(false)
    }
  }

  const resend = async (address = email) => {
    setResending(true)
    setError('')
    setNotice(null)
    try {
      const res = await axios.post(`${API}/resend-email-otp`, { email: address })
      if (res.data.alreadyVerified) return toLogin(res.data.message)
      if (address !== email) update({ email: address })
      codeWentOut(res.data)
      toast.success('A new code is on its way')
    } catch (err) {
      const retryAfter = err.response?.data?.retryAfter
      if (retryAfter) startResendCooldown(retryAfter)
      setError(authErrorMessage(err))
    } finally {
      setResending(false)
    }
  }

  const changeEmail = async (e) => {
    e.preventDefault()
    const address = newEmail.trim()
    if (!EMAIL_RE.test(address)) {
      setChangeError('Enter a valid email address')
      return
    }
    setChangeLoading(true)
    setChangeError('')
    try {
      const res = await axios.post(`${API}/change-email`, { verifyToken, newEmail: address })
      update({ email: res.data.email, verifyToken: res.data.verifyToken })
      codeWentOut(res.data)
      setChanging(false)
      setNewEmail('')
      setNotice(null)
      toast.success(res.data.message)
    } catch (err) {
      const data = err.response?.data
      if (data?.emailFailed && data.email) {
        // address changed, but the code didn't go out
        update({ email: data.email, verifyToken: data.verifyToken, emailFailed: true })
        startResendCooldown(0)
        setChanging(false)
        setNotice({ tone: 'warning', text: data.message })
      } else {
        setChangeError(authErrorMessage(err))
      }
    } finally {
      setChangeLoading(false)
    }
  }

  // Opened without an email (e.g. bookmarked): ask which account to send the code to
  if (!email) {
    return (
      <AuthCard
        icon={MailCheck}
        title='Verify your email'
        subtitle="Enter the email you signed up with and we'll send you a 6-digit code."
        footer={
          <>
            Already verified?{' '}
            <Link to='/login' className='font-semibold text-pink-600 hover:underline'>
              Log in
            </Link>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!EMAIL_RE.test(emailInput.trim())) return setError('Enter a valid email address')
            resend(emailInput.trim().toLowerCase())
          }}
          noValidate
          className='space-y-4'
        >
          {error && <Notice>{error}</Notice>}
          <AuthField
            label='Email'
            id='email'
            type='email'
            icon={Mail}
            autoComplete='email'
            placeholder='you@example.com'
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.target.value)
              setError('')
            }}
          />
          <SubmitButton loading={resending} loadingText='Sending…'>
            Send code
          </SubmitButton>
        </form>
      </AuthCard>
    )
  }

  const expired = !session.emailFailed && expiresIn === 0

  return (
    <AuthCard
      icon={MailCheck}
      title='Verify your email'
      subtitle={
        <>
          Enter the 6-digit code we sent to <span className='font-semibold wrap-break-word text-gray-900'>{email}</span>
        </>
      }
      footer={
        <>
          Already verified?{' '}
          <Link to='/login' state={{ email, from }} className='font-semibold text-pink-600 hover:underline'>
            Log in
          </Link>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          verify(digits.join(''))
        }}
        noValidate
        className='space-y-5'
      >
        {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
        {error && <Notice>{error}</Notice>}

        <OtpInput
          digits={digits}
          onChange={(next) => {
            setDigits(next)
            if (error) setError('')
          }}
          onComplete={verify}
          disabled={verifying}
          invalid={Boolean(error)}
        />

        {!session.emailFailed && (
          <p className={`flex items-center justify-center gap-1.5 text-sm ${expired ? 'text-red-600' : 'text-gray-500'}`} aria-live='polite'>
            <Clock className='h-4 w-4' />
            {expired ? 'This code has expired. Request a new one below.' : `Code expires in ${clock(expiresIn)}`}
          </p>
        )}

        <SubmitButton loading={verifying} loadingText='Verifying…' disabled={expired || session.emailFailed}>
          Verify email
        </SubmitButton>

        <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-sm'>
          <button
            type='button'
            onClick={() => resend()}
            disabled={resending || resendIn > 0}
            className='inline-flex cursor-pointer items-center gap-1.5 font-semibold text-pink-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline'
          >
            <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
            {resendIn > 0 ? `Resend code in ${resendIn}s` : resending ? 'Sending…' : 'Resend code'}
          </button>
          <button
            type='button'
            onClick={() => {
              setChanging((open) => !open)
              setChangeError('')
            }}
            aria-expanded={changing}
            className='inline-flex cursor-pointer items-center gap-1.5 font-semibold text-gray-600 hover:text-gray-900'
          >
            <Pencil className='h-4 w-4' /> Change email
          </button>
        </div>
      </form>

      {changing && (
        <div className='mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4'>
          {verifyToken ? (
            <form onSubmit={changeEmail} noValidate className='space-y-3'>
              <AuthField
                label='New email'
                id='new-email'
                type='email'
                icon={Mail}
                autoComplete='email'
                placeholder='you@example.com'
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value)
                  setChangeError('')
                }}
                error={changeError}
                hint="We'll send a new code there."
              />
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => setChanging(false)}
                  className='h-10 flex-1 cursor-pointer rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50'
                >
                  Cancel
                </button>
                <SubmitButton loading={changeLoading} loadingText='Sending…' className='h-10 flex-1'>
                  Send code
                </SubmitButton>
              </div>
            </form>
          ) : (
            <p className='text-sm text-gray-600'>
              To use a different email,{' '}
              <Link to='/signup' state={{ from }} className='font-semibold text-pink-600 hover:underline' onClick={clearVerifyState}>
                sign up again
              </Link>{' '}
              with the right address.
            </p>
          )}
        </div>
      )}

      <div className='mt-5 space-y-2 rounded-xl bg-gray-50 p-4 text-xs text-gray-500'>
        <p>Can't find the email? Check your spam or promotions folder. Never share this code with anyone.</p>
        {/@gmail\.com$/i.test(email) && (
          <a href={gmailSearch(email)} target='_blank' rel='noopener noreferrer' className='inline-flex items-center gap-1 font-semibold text-pink-600 hover:underline'>
            <ExternalLink className='h-3.5 w-3.5' /> Open Gmail
          </a>
        )}
      </div>
    </AuthCard>
  )
}

export default Verify

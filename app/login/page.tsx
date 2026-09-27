'use client'

import { FormEvent, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')

    const { error: signInError } = await createClient().auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      const authMessage = signInError.message.toLowerCase().includes('confirm')
        ? 'Please confirm your email before signing in.'
        : 'Invalid email or password.'

      setError(authMessage)
      setLoading(false)
      return
    }

    window.location.href = '/member'
  }

  async function resend() {
    const email = window.prompt('Enter the email you registered with:')
    if (!email) return

    const { error } = await createClient().auth.resend({
      type: 'signup',
      email,
    })

    setMessage(
      error ? 'We could not resend the email right now.' : 'A new confirmation email is on its way.',
    )
  }

  return (
    <main className="auth-page">
      <a className="auth-back" href="/">
        ← Back to home
      </a>

      <div className="auth-shell">
        <div className="auth-intro">
          <p className="eyebrow light">Welcome back</p>
          <h1>Stay close to the movement.</h1>
          <p>Sign in to manage your events, onboarding, community, and giving.</p>
        </div>

        <div className="auth-card">
          <p className="eyebrow">Member login</p>
          <h2>Good to see you.</h2>
          <p className="auth-muted">Use the email and password you registered with.</p>

          <form onSubmit={submit}>
            <label>
              Email address
              <input required name="email" type="email" autoComplete="email" />
            </label>

            <label>
              Password
              <input required name="password" type="password" autoComplete="current-password" />
            </label>

            {error && <p className="form-error">{error}</p>}
            {message && (
              <p className="form-success">
                <CheckCircle2 size={15} />
                {message}
              </p>
            )}

            <button className="button button-yellow submit-button" disabled={loading}>
              {loading ? 'Signing in…' : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <button className="text-link auth-resend" onClick={resend}>
            Resend confirmation email <ArrowRight size={15} />
          </button>

          <p className="auth-footer">
            New to IMCS-PAX? <a href="/register">Create an account</a>
          </p>
        </div>
      </div>
    </main>
  )
}

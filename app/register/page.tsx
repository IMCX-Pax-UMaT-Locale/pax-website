'use client'

import { FormEvent, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        data: {
          first_name: form.get('firstName'),
          last_name: form.get('lastName'),
          graduation_year: form.get('graduationYear'),
        },
      },
    })

    if (signUpError) {
      setError('We could not complete registration. Please check your details and try again.')
      return
    }

    setSent(true)
  }

  return (
    <main className="auth-page">
      <a className="auth-back" href="/">
        ← Back to home
      </a>

      <div className="auth-shell">
        <div className="auth-intro">
          <p className="eyebrow light">Join the movement</p>
          <h1>Your next chapter starts here.</h1>
          <p>Become part of a community growing in faith, friendship, and service.</p>
        </div>

        <div className="auth-card">
          {sent ? (
            <div className="success-state">
              <CheckCircle2 size={42} />
              <h2>Check your inbox.</h2>
              <p>
                We sent a verification link to your email. Confirm it to continue with your onboarding.
              </p>
              <a className="button button-navy" href="/">
                Return home <ArrowRight size={16} />
              </a>
            </div>
          ) : (
            <>
              <p className="eyebrow">Member registration</p>
              <h2>Welcome home.</h2>
              <p className="auth-muted">Create your account and tell us a little about yourself.</p>

              <form onSubmit={submit}>
                <div className="form-row">
                  <label>
                    First name
                    <input required name="firstName" autoComplete="given-name" />
                  </label>

                  <label>
                    Last name
                    <input required name="lastName" autoComplete="family-name" />
                  </label>
                </div>

                <label>
                  Email address
                  <input required name="email" type="email" autoComplete="email" />
                </label>

                <label>
                  Graduation year
                  <input
                    required
                    name="graduationYear"
                    type="number"
                    min="1950"
                    max="2100"
                    placeholder="e.g. 2026"
                  />
                </label>

                <label>
                  Password
                  <input
                    required
                    name="password"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>

                {error && <p className="form-error">{error}</p>}

                <button className="button button-yellow submit-button" type="submit">
                  Create account <ArrowRight size={16} />
                </button>
              </form>

              <p className="auth-footer">
                Already a member? <a href="/login">Sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

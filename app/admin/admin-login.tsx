'use client'

import { FormEvent, useState } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLogin({ initialError }: { initialError?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError || '')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const supabase = createClient()
    await supabase.auth.signOut()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get('email') || '').trim(),
      password: String(form.get('password') || ''),
    })
    if (signInError) {
      setError(signInError.message.toLowerCase().includes('confirm')
        ? 'Please confirm your email before signing in.'
        : 'Invalid admin email or password.')
      setLoading(false)
      return
    }

    const accessResponse = await fetch('/api/admin/access', { cache: 'no-store' })
    const accessResult = await accessResponse.json() as { allowed?: boolean; error?: string }
    if (!accessResponse.ok || !accessResult.allowed) {
      await supabase.auth.signOut()
      setError(accessResult.error || 'This account does not have administrator access.')
      setLoading(false)
      return
    }

    window.location.href = '/admin'
  }

  return (
    <main className="auth-page admin-login-page">
      <a className="auth-back" href="/">← Back to home</a>
      <div className="auth-shell">
        <div className="auth-intro">
          <ShieldCheck size={36} className="admin-login-icon" />
          <p className="eyebrow light">Restricted access</p>
          <h1>Admin console.</h1>
          <p>Sign in with the configured administrator account to manage the IMCS-PAX Romana platform.</p>
        </div>
        <div className="auth-card">
          <p className="eyebrow">Administrator login</p>
          <h2>Welcome back.</h2>
          <p className="auth-muted">Use the administrator email and password.</p>
          <form onSubmit={submit}>
            <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-yellow submit-button" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : <>Enter admin console <ArrowRight size={16} /></>}
            </button>
          </form>
          <p className="auth-footer"><a href="/login">Use member login instead</a></p>
        </div>
      </div>
    </main>
  )
}

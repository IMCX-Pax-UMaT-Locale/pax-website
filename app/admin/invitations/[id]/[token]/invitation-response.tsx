'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InvitationResponse({ invitationId, token, expires, signedInEmail }: { invitationId: string; token: string; expires: string; signedInEmail: string | null }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [responded, setResponded] = useState(false)

  async function respond(decision: 'accepted' | 'declined') {
    setLoading(true); setError(''); setMessage('')
    const user = (await createClient().auth.getUser()).data.user
    if (!user) {
      setError('Please sign in with the invited member account first, then return to this link.')
      setLoading(false)
      return
    }
    const response = await fetch(`/api/admin/members/invite/${invitationId}?expires=${encodeURIComponent(expires)}&token=${encodeURIComponent(token)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    })
    const result = await response.json() as { error?: string; accepted?: boolean }
    if (!response.ok) setError(result.error || 'Unable to respond to invitation.')
    else { setResponded(true); setMessage(result.accepted ? 'You are now an administrator. You can open the admin console.' : 'The invitation was declined.') }
    setLoading(false)
  }

  return (
    <main className="auth-page">
      <a className="auth-back" href="/">← Back to home</a>
      <div className="auth-shell">
        <div className="auth-intro"><p className="eyebrow light">IMCS-PAX Romana</p><h1>Administrator invitation.</h1><p>Review your invitation to help manage the community platform.</p></div>
        <div className="auth-card"><p className="eyebrow">Admin invitation</p><h2>{responded ? 'Response recorded.' : 'You are invited.'}</h2><p className="auth-muted">{signedInEmail ? `Signed in as ${signedInEmail}.` : 'Sign in with the invited account before choosing an option.'}</p>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success">{message}</p>}{!responded && <div className="invitation-actions"><button className="button button-yellow" disabled={loading} onClick={() => respond('accepted')}>Accept invitation</button><button className="button button-ghost" disabled={loading} onClick={() => respond('declined')}>Decline</button></div>}{responded && <a className="button button-navy" href="/admin">Open admin console</a>}</div>
      </div>
    </main>
  )
}

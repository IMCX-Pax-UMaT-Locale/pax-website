'use client'

import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminHeader({ email }: { email?: string | null }) {
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')

  async function signOut() {
    setSigningOut(true)
    setError('')
    const { error: signOutError } = await createClient().auth.signOut()
    if (signOutError) {
      setError('Unable to sign out. Please try again.')
      setSigningOut(false)
      return
    }
    window.location.href = '/login'
  }

  return (
    <header className="admin-header">
      <a className="brand" href="/">
        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pax-zSl5nZpSKwiZozwALkXHLvfNU1ObRp.jpg" alt="IMCS-PAX Romana logo" />
        <span><strong>IMCS</strong><small>PAX ROMANA</small></span>
      </a>
      <span className="admin-title">Admin console</span>
      <div className="admin-session">
        <span className="admin-identity" title={email || 'Administrator'}>{email || 'Administrator'}</span>
        <a href="/" className="text-link">View site</a>
        <button className="admin-signout" onClick={signOut} disabled={signingOut}>
          <LogOut size={15} /> {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
        {error && <span className="admin-session-error" role="alert">{error}</span>}
      </div>
    </header>
  )
}

'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Settings = Record<string, string>
type Profile = { first_name: string; last_name: string; contact_info: string | null }

export default function SettingsManager() {
  const [settings, setSettings] = useState<Settings>({})
  const [profile, setProfile] = useState<Profile>({ first_name: '', last_name: '', contact_info: '' })
  const [password, setPassword] = useState({ value: '', confirmation: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings').then(async (response) => {
      const result = await response.json() as { settings?: Settings; profile?: Profile; error?: string }
      if (!response.ok) throw new Error(result.error || 'Unable to load settings.')
      setSettings(result.settings || {})
      if (result.profile) setProfile({ ...result.profile, contact_info: result.profile.contact_info || '' })
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load settings.')).finally(() => setLoading(false))
  }, [])

  async function save(form: FormEvent<HTMLFormElement>, section: 'profile' | 'site') {
    form.preventDefault()
    setError(''); setMessage('')
    const data = new FormData(form.currentTarget)
    const values = Object.fromEntries(data.entries())
    const body = section === 'profile'
      ? { profile: { first_name: String(values.first_name || ''), last_name: String(values.last_name || ''), contact_info: String(values.contact_info || '') } }
      : { settings: values }
    const response = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const result = await response.json() as { error?: string }
    if (!response.ok) { setError(result.error || 'Unable to save settings.'); return }
    if (section === 'profile') setProfile({ first_name: String(values.first_name), last_name: String(values.last_name), contact_info: String(values.contact_info || '') })
    else setSettings({ ...settings, ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)])) })
    setMessage('Settings saved.')
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(''); setMessage('')
    if (password.value.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password.value !== password.confirmation) { setError('Passwords do not match.'); return }
    const { error: updateError } = await createClient().auth.updateUser({ password: password.value })
    if (updateError) { setError('Unable to update password. Please try again.'); return }
    setPassword({ value: '', confirmation: '' })
    setMessage('Password updated.')
  }

  if (loading) return <p className="auth-muted">Loading settings…</p>
  return (
    <div className="settings-grid">
      {message && <p className="form-success settings-message">{message}</p>}{error && <p className="form-error settings-message">{error}</p>}
      <section className="settings-card"><p className="eyebrow">Your account</p><h2>Administrator profile</h2><form onSubmit={(event) => save(event, 'profile')}><div className="form-row"><label>First name<input name="first_name" defaultValue={profile.first_name} required /></label><label>Last name<input name="last_name" defaultValue={profile.last_name} required /></label></div><label>Contact details<input name="contact_info" defaultValue={profile.contact_info || ''} /></label><button className="button button-yellow" type="submit">Save profile</button></form></section>
      <section className="settings-card"><p className="eyebrow">Security</p><h2>Change password</h2><form onSubmit={changePassword}><label>New password<input type="password" minLength={8} autoComplete="new-password" value={password.value} onChange={(event) => setPassword({ ...password, value: event.target.value })} required /></label><label>Confirm password<input type="password" minLength={8} autoComplete="new-password" value={password.confirmation} onChange={(event) => setPassword({ ...password, confirmation: event.target.value })} required /></label><button className="button button-navy" type="submit">Update password</button></form></section>
      <section className="settings-card settings-wide"><p className="eyebrow">Public site</p><h2>Organization and homepage</h2><form onSubmit={(event) => save(event, 'site')}><label>Organization name<input name="organization_name" defaultValue={settings.organization_name || ''} placeholder="IMCS-PAX Romana UMaT Local" /></label><label>Homepage announcement<input name="announcement_text" defaultValue={settings.announcement_text || ''} placeholder="Next service: Sunday, 7:00 AM…" /></label><div className="form-row"><label>Contact email<input name="contact_email" type="email" defaultValue={settings.contact_email || ''} /></label><label>Contact phone<input name="contact_phone" defaultValue={settings.contact_phone || ''} /></label></div><label>Address<input name="address" defaultValue={settings.address || ''} /></label><div className="form-row"><label>Facebook URL<input name="social_facebook" type="url" defaultValue={settings.social_facebook || ''} /></label><label>Instagram URL<input name="social_instagram" type="url" defaultValue={settings.social_instagram || ''} /></label></div><button className="button button-yellow" type="submit">Save site settings</button></form></section>
    </div>
  )
}

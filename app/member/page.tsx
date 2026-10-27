'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  CircleUserRound,
  Clock3,
  Heart,
  LogOut,
  MapPin,
  Ticket,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  first_name: string
  last_name: string
  contact_info: string | null
  program: string | null
  graduation_year: number | null
  role: 'member' | 'alumni' | 'admin'
  created_at: string
}

type Registration = {
  status: string
  events: {
    title: string
    starts_at: string
    venue: string
    city: string | null
  } | null
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export default function MemberPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [attendedCount, setAttendedCount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const [profileResult, registrationsResult, attendedResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name, contact_info, program, graduation_year, role, created_at')
          .eq('id', user.id)
          .single(),
        supabase
          .from('event_registrations')
          .select('status, events(title, starts_at, venue, city)')
          .eq('member_id', user.id)
          .neq('status', 'cancelled')
          .order('registered_at', { ascending: false }),
        supabase
          .from('event_registrations')
          .select('event_id', { count: 'exact', head: true })
          .eq('member_id', user.id)
          .eq('status', 'attended'),
      ])

      if (profileResult.error || registrationsResult.error || attendedResult.error) {
        setError('We could not load your member dashboard. Please try again.')
        return
      }

      setProfile(profileResult.data)
      setRegistrations((registrationsResult.data || []).map((registration) => ({
        status: registration.status,
        events: Array.isArray(registration.events) ? registration.events[0] || null : registration.events,
      })) as Registration[])
      setAttendedCount(attendedResult.count || 0)
    }

    loadDashboard()
  }, [])

  async function signOut() {
    const { error: signOutError } = await createClient().auth.signOut()
    if (signOutError) {
      setError('We could not sign you out. Please try again.')
      return
    }
    window.location.href = '/'
  }

  if (error) {
    return <main className="auth-page"><div className="auth-card"><p className="form-error">{error}</p></div></main>
  }

  if (!profile) {
    return <main className="auth-page"><div className="auth-card"><p className="auth-muted">Loading your member space…</p></div></main>
  }

  const name = `${profile.first_name} ${profile.last_name}`.trim() || 'Member'
  const memberSince = new Date(profile.created_at).getFullYear().toString()
  const alumniStatus = profile.role === 'alumni' ? 'Alumni' : profile.graduation_year ? `Class of ${profile.graduation_year}` : 'Member'

  return (
    <main className="portal-page">
      <header className="portal-header">
        <a className="brand" href="/">
          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pax-zSl5nZpSKwiZozwALkXHLvfNU1ObRp.jpg" alt="IMCS-PAX Romana logo" />
          <span><strong>IMCS</strong><small>PAX ROMANA</small></span>
        </a>
        <div className="portal-user">
          <CircleUserRound size={22} />
          <span>Welcome, {name}</span>
          <button aria-label="Sign out" onClick={signOut}><LogOut size={16} /></button>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-nav">
          <span className="portal-label">Member space</span>
          <a className="selected" href="/member"><CircleUserRound size={17} /> Overview</a>
          <a href="#events"><CalendarDays size={17} /> My events</a>
          <a href="#alumni"><Users size={17} /> Alumni community</a>
          <a href="#give"><Heart size={17} /> My giving</a>
        </aside>

        <section className="portal-content">
          <div className="portal-welcome">
            <div>
              <p className="eyebrow">Member dashboard</p>
              <h1>Good morning, {profile.first_name || 'member'}.</h1>
              <p>Your place to stay connected with the movement.</p>
            </div>
            <a className="button button-yellow" href="/#events">Find an event <Ticket size={16} /></a>
          </div>

          <div className="portal-stats">
            <StatCard label="Member since" value={memberSince} />
            <StatCard label="Events attended" value={attendedCount.toString()} />
            <StatCard label="Community" value={profile.contact_info || 'Not set'} />
            <StatCard label="Alumni status" value={alumniStatus} />
          </div>

          <div className="portal-section" id="events">
            <div className="portal-section-heading">
              <div><p className="eyebrow">Your calendar</p><h2>Registered events</h2></div>
              <a className="text-link" href="/#events">Browse events →</a>
            </div>
            <div className="registered-events">
              {registrations.length === 0 && <p className="auth-muted">You have no registered events yet.</p>}
              {registrations.map((registration) => registration.events && (
                <article key={`${registration.events.title}-${registration.events.starts_at}`}>
                  <div className="portal-event-icon"><CalendarDays size={20} /></div>
                  <div>
                    <span className="event-type">{registration.status}</span>
                    <h3>{registration.events.title}</h3>
                    <p><Clock3 size={14} /> {formatDate(registration.events.starts_at)} &nbsp; <MapPin size={14} /> {registration.events.venue}{registration.events.city ? `, ${registration.events.city}` : ''}</p>
                  </div>
                  <button className="button button-ghost">View details</button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

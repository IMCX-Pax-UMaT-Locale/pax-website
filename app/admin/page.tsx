import { CalendarDays, ChevronRight, ImagePlus, LayoutDashboard, Settings, Users, WalletCards } from 'lucide-react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminHeader from './admin-header'
import AdminLogin from './admin-login'

type ProfileRow = {
  id: string
  first_name: string
  last_name: string
  contact_info: string | null
  role: 'member' | 'alumni' | 'admin'
  created_at: string
}

type EventRow = { title: string; starts_at: string; venue: string; city: string | null }

const adminNavLinks = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard, active: true },
  { label: 'Members & alumni', href: '/admin/members', icon: Users },
  { label: 'Events & flyers', href: '/admin/events', icon: CalendarDays },
  { label: 'Media carousel', href: '/admin/media', icon: ImagePlus },
  { label: 'Donations', href: '/admin/donations', icon: WalletCards },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date))
}

export default async function AdminPage() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <AdminLogin />

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('profiles').select('role, is_active').eq('id', user.id).single()
  if (currentProfileError || currentProfile?.role !== 'admin' || currentProfile.is_active === false) {
    return <AdminLogin />
  }

  const [profilesResult, alumniResult, eventsResult, donationsResult] = await Promise.all([
    supabase.from('profiles').select('id, first_name, last_name, contact_info, role, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'alumni'),
    supabase.from('events').select('title, starts_at, venue, city').eq('status', 'published').gte('starts_at', new Date().toISOString()).order('starts_at').limit(5),
    supabase.from('donations').select('amount').eq('status', 'paid'),
  ])

  if (profilesResult.error || alumniResult.error || eventsResult.error || donationsResult.error) {
    throw new Error('Unable to load admin dashboard data.')
  }

  const profiles = (profilesResult.data || []) as ProfileRow[]
  const events = (eventsResult.data || []) as EventRow[]
  const donations = donationsResult.data || []
  const totalGiving = donations.reduce((sum, donation) => sum + Number(donation.amount), 0)

  return (
    <main className="admin-page">
      <AdminHeader email={user.email} />
      <div className="admin-layout">
        <aside className="admin-nav"><span className="portal-label">Manage</span>{adminNavLinks.map(({ label, href, icon: Icon, active }) => <a key={label} className={active ? 'selected' : ''} href={href}><Icon size={17} /> {label}</a>)}</aside>
        <section className="admin-content">
          <p className="eyebrow">{new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(new Date())}</p>
          <h1>Good morning, admin.</h1>
          <div className="admin-stats">
            <div><span>Total members</span><strong>{profilesResult.count ?? '—'}</strong><small>Registered profiles</small></div>
            <div><span>Upcoming events</span><strong>{events.length}</strong><small>Published events</small></div>
            <div><span>Alumni community</span><strong>{alumniResult.count ?? '—'}</strong><small>Registered alumni</small></div>
            <div><span>Giving recorded</span><strong>{new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(totalGiving / 100)}</strong><small>Paid donations</small></div>
          </div>
          <div className="admin-grid">
            <div className="admin-panel" id="members">
              <div className="panel-head"><div><p className="eyebrow">People</p><h2>Recent members</h2></div><a className="text-link" href="/admin/members">View all <ChevronRight size={15} /></a></div>
              <div className="member-table">
                {profiles.map((profile) => {
                  const name = `${profile.first_name} ${profile.last_name}`.trim() || 'Unnamed member'
                  return <div className="member-row" key={profile.id}><div className="avatar">{name.split(' ').map((part) => part[0]).join('')}</div><div><strong>{name}</strong><small>{profile.contact_info || 'No community details'}</small></div><span>{profile.role}</span><b className={profile.role === 'alumni' ? 'status alumni' : 'status active'}>{profile.role}</b></div>
                })}
              </div>
            </div>
            <div className="admin-panel" id="events">
              <div className="panel-head"><div><p className="eyebrow">Programmes</p><h2>Upcoming schedule</h2></div></div>
              <div className="mini-list">{events.length === 0 && <p className="auth-muted">No upcoming published events.</p>}{events.map((event) => <div key={`${event.title}-${event.starts_at}`}><strong>{event.title}</strong><small>{formatDate(event.starts_at)} · {event.venue}{event.city ? `, ${event.city}` : ''}</small></div>)}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

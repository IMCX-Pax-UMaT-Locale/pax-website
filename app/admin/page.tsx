import { CalendarDays, ChevronRight, ImagePlus, LayoutDashboard, Settings, Users, WalletCards } from 'lucide-react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
  { label: 'Members & alumni', href: '#members', icon: Users },
  { label: 'Events & flyers', href: '#events', icon: CalendarDays },
  { label: 'Media carousel', href: '#media', icon: ImagePlus },
  { label: 'Donations', href: '#donations', icon: WalletCards },
  { label: 'Settings', href: '#settings', icon: Settings },
]

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date))
}

export default async function AdminPage() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (currentProfileError || currentProfile?.role !== 'admin') redirect('/member')

  const [profilesResult, eventsResult, donationsResult] = await Promise.all([
    supabase.from('profiles').select('id, first_name, last_name, contact_info, role, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
    supabase.from('events').select('title, starts_at, venue, city').eq('status', 'published').gte('starts_at', new Date().toISOString()).order('starts_at').limit(5),
    supabase.from('donations').select('amount').eq('status', 'paid'),
  ])

  if (profilesResult.error || eventsResult.error || donationsResult.error) {
    throw new Error('Unable to load admin dashboard data.')
  }

  const profiles = (profilesResult.data || []) as ProfileRow[]
  const events = (eventsResult.data || []) as EventRow[]
  const donations = donationsResult.data || []
  const totalGiving = donations.reduce((sum, donation) => sum + Number(donation.amount), 0)

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="brand" href="/"><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pax-zSl5nZpSKwiZozwALkXHLvfNU1ObRp.jpg" alt="IMCS-PAX Romana logo" /><span><strong>IMCS</strong><small>PAX ROMANA</small></span></a>
        <span className="admin-title">Admin console</span>
        <a href="/" className="text-link">View site <ChevronRight size={15} /></a>
      </header>
      <div className="admin-layout">
        <aside className="admin-nav"><span className="portal-label">Manage</span>{adminNavLinks.map(({ label, href, icon: Icon, active }) => <a key={label} className={active ? 'selected' : ''} href={href}><Icon size={17} /> {label}</a>)}</aside>
        <section className="admin-content">
          <p className="eyebrow">{new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(new Date())}</p>
          <h1>Good morning, admin.</h1>
          <div className="admin-stats">
            <div><span>Total members</span><strong>{profilesResult.count ?? '—'}</strong><small>Registered profiles</small></div>
            <div><span>Upcoming events</span><strong>{events.length}</strong><small>Published events</small></div>
            <div><span>Alumni community</span><strong>{profiles.filter((profile) => profile.role === 'alumni').length}</strong><small>In recent members</small></div>
            <div><span>Giving recorded</span><strong>{new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(totalGiving / 100)}</strong><small>Paid donations</small></div>
          </div>
          <div className="admin-grid">
            <div className="admin-panel" id="members">
              <div className="panel-head"><div><p className="eyebrow">People</p><h2>Recent members</h2></div><a className="text-link" href="#members">View all <ChevronRight size={15} /></a></div>
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

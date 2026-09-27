import { CalendarDays, ChevronRight, ImagePlus, LayoutDashboard, Settings, Users, WalletCards } from 'lucide-react'

const rows = [
  { name: 'Ifeoma Nwosu', email: 'ifeoma@example.com', chapter: 'Lagos', status: 'Active' },
  { name: 'Daniel Okafor', email: 'daniel@example.com', chapter: 'Abuja', status: 'Active' },
  { name: 'Chinonso Eze', email: 'chinonso@example.com', chapter: 'Enugu', status: 'Alumni' },
]

const adminNavLinks = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard, active: true },
  { label: 'Members & alumni', href: '#members', icon: Users },
  { label: 'Events & flyers', href: '#events', icon: CalendarDays },
  { label: 'Media carousel', href: '#media', icon: ImagePlus },
  { label: 'Donations', href: '#donations', icon: WalletCards },
  { label: 'Settings', href: '#settings', icon: Settings },
]

const stats = [
  { label: 'Total members', value: '1,248', detail: '+8.2% this month' },
  { label: 'Upcoming events', value: '08', detail: '3 need attention' },
  { label: 'Alumni community', value: '384', detail: '24 new this year' },
  { label: 'Giving this month', value: '₦2.4m', detail: '+14.6% vs July' },
]

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  )
}

export default function AdminPage() {
  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="brand" href="/">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pax-zSl5nZpSKwiZozwALkXHLvfNU1ObRp.jpg"
            alt="IMCS-PAX Romana logo"
          />
          <span>
            <strong>IMCS</strong>
            <small>PAX ROMANA</small>
          </span>
        </a>

        <span className="admin-title">Admin console</span>

        <a href="/" className="text-link">
          View site <ChevronRight size={15} />
        </a>
      </header>

      <div className="admin-layout">
        <aside className="admin-nav">
          <span className="portal-label">Manage</span>

          {adminNavLinks.map(({ label, href, icon: Icon, active }) => (
            <a key={label} className={active ? 'selected' : ''} href={href}>
              <Icon size={17} /> {label}
            </a>
          ))}
        </aside>

        <section className="admin-content">
          <p className="eyebrow">Monday, August 25, 2026</p>
          <h1>Good morning, admin.</h1>

          <div className="admin-stats">
            {stats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} />
            ))}
          </div>

          <div className="admin-grid">
            <div className="admin-panel" id="members">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">People</p>
                  <h2>Recent members</h2>
                </div>

                <a className="text-link" href="#members">
                  View all <ChevronRight size={15} />
                </a>
              </div>

              <div className="member-table">
                {rows.map((row) => (
                  <div className="member-row" key={row.email}>
                    <div className="avatar">
                      {row.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </div>

                    <div>
                      <strong>{row.name}</strong>
                      <small>{row.email}</small>
                    </div>

                    <span>{row.chapter}</span>
                    <b className={row.status === 'Alumni' ? 'status alumni' : 'status active'}>
                      {row.status}
                    </b>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-panel" id="events">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Programmes</p>
                  <h2>Upcoming schedule</h2>
                </div>
              </div>

              <div className="mini-list">
                <div>
                  <strong>National Pax Conference</strong>
                  <small>Sep 14 · UMaT Campus</small>
                </div>
                <div>
                  <strong>Pax-Sice: The Table</strong>
                  <small>Oct 03 · Ikeja</small>
                </div>
                <div>
                  <strong>Community Mass</strong>
                  <small>Oct 18 · Chaplaincy</small>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

'use client'

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

const myEvents = [
  {
    title: 'National Pax Conference 2026',
    date: 'Sep 14 – 16, 2026',
    place: "St. Peter's Hall, Lagos",
    status: 'Registered',
  },
  {
    title: 'Pax-Sice: The Table',
    date: 'Oct 03, 2026 · 5:30 PM',
    place: 'The Garden, Ikeja',
    status: 'Registered',
  },
]

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function MemberPage() {
  return (
    <main className="portal-page">
      <header className="portal-header">
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

        <div className="portal-user">
          <CircleUserRound size={22} />
          <span>Welcome, Ifeoma</span>
          <button aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="portal-layout">
        <aside className="portal-nav">
          <span className="portal-label">Member space</span>
          <a className="selected" href="/member">
            <CircleUserRound size={17} /> Overview
          </a>
          <a href="#events">
            <CalendarDays size={17} /> My events
          </a>
          <a href="#alumni">
            <Users size={17} /> Alumni community
          </a>
          <a href="#give">
            <Heart size={17} /> My giving
          </a>
        </aside>

        <section className="portal-content">
          <div className="portal-welcome">
            <div>
              <p className="eyebrow">Member dashboard</p>
              <h1>Good morning, Ifeoma.</h1>
              <p>Your place to stay connected with the movement.</p>
            </div>

            <a className="button button-yellow" href="/#events">
              Find an event <Ticket size={16} />
            </a>
          </div>

          <div className="portal-stats">
            <StatCard label="Member since" value="2022" />
            <StatCard label="Events attended" value="12" />
            <StatCard label="Community" value="Lagos" />
            <StatCard label="Alumni status" value="In 2 years" />
          </div>

          <div className="portal-section" id="events">
            <div className="portal-section-heading">
              <div>
                <p className="eyebrow">Your calendar</p>
                <h2>Registered events</h2>
              </div>

              <a className="text-link" href="/#events">
                Browse events →
              </a>
            </div>

            <div className="registered-events">
              {myEvents.map((event) => (
                <article key={event.title}>
                  <div className="portal-event-icon">
                    <CalendarDays size={20} />
                  </div>

                  <div>
                    <span className="event-type">{event.status}</span>
                    <h3>{event.title}</h3>
                    <p>
                      <Clock3 size={14} /> {event.date} &nbsp; <MapPin size={14} /> {event.place}
                    </p>
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

'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { CalendarDays, Pencil, Plus, Trash2, Users, X } from 'lucide-react'

type EventStatus = 'draft' | 'published' | 'cancelled'
type EventItem = {
  id: string
  title: string
  event_type: string
  description: string | null
  starts_at: string
  ends_at: string | null
  venue: string
  city: string | null
  flyer_url: string | null
  status: EventStatus
  event_registrations?: { count: number }[]
}
type Registration = { event_id: string; member_id: string; status: string; registered_at: string; attended_at: string | null; profiles: { first_name: string; last_name: string; contact_info: string | null; program: string | null } | null }

function localDate(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : ''
}

function initialEvent(event?: EventItem) {
  return {
    id: event?.id || '', title: event?.title || '', event_type: event?.event_type || 'Community',
    description: event?.description || '', starts_at: localDate(event?.starts_at || null), ends_at: localDate(event?.ends_at || null),
    venue: event?.venue || '', city: event?.city || '', flyer_url: event?.flyer_url || '', status: event?.status || 'draft',
  }
}

export default function EventsManager() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [registrations, setRegistrations] = useState<{ event: EventItem; rows: Registration[] } | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    const response = await fetch(`/api/admin/events?status=${statusFilter}`)
    const result = await response.json() as { events?: EventItem[]; error?: string }
    if (!response.ok) setError(result.error || 'Unable to load events.')
    else setEvents(result.events || [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { loadEvents() }, [loadEvents])

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/admin/events', { method: editing ? 'PATCH' : 'POST', body: form })
    const result = await response.json() as { error?: string }
    if (!response.ok) { setError(result.error || 'Unable to save event.'); return }
    setEditing(null); setCreating(false); setMessage(editing ? 'Event updated.' : 'Event created.')
    await loadEvents()
  }

  async function deleteEvent(item: EventItem) {
    if (!window.confirm(`Delete "${item.title}"? Registrations will also be removed.`)) return
    const response = await fetch('/api/admin/events', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) })
    const result = await response.json() as { error?: string }
    if (!response.ok) { setError(result.error || 'Unable to delete event.'); return }
    setMessage('Event deleted.')
    await loadEvents()
  }

  async function viewRegistrations(item: EventItem) {
    setError('')
    const response = await fetch(`/api/admin/events/${item.id}/registrations`)
    const result = await response.json() as { registrations?: Registration[]; error?: string }
    if (!response.ok) { setError(result.error || 'Unable to load registrations.'); return }
    setRegistrations({ event: item, rows: result.registrations || [] })
  }

  async function updateRegistration(row: Registration, status: string) {
    if (!registrations) return
    const response = await fetch(`/api/admin/events/${registrations.event.id}/registrations`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: row.member_id, status }) })
    if (!response.ok) { setError('Unable to update attendance.'); return }
    setRegistrations({ ...registrations, rows: registrations.rows.map((item) => item.member_id === row.member_id ? { ...item, status, attended_at: status === 'attended' ? new Date().toISOString() : null } : item) })
  }

  const formEvent = editing || (creating ? undefined : null)
  return (
    <>
      <div className="event-toolbar"><select aria-label="Filter events" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All events</option><option value="draft">Drafts</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select><button className="button button-yellow" onClick={() => { setCreating(true); setEditing(null) }}><Plus size={16} /> New event</button></div>
      {message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}
      <div className="event-admin-list">{loading ? <p className="auth-muted">Loading events…</p> : events.length === 0 ? <p className="auth-muted">No events match this filter.</p> : events.map((item) => <article className="event-admin-card" key={item.id}>
        {item.flyer_url ? <img src={item.flyer_url} alt="" /> : <div className="event-placeholder"><CalendarDays size={24} /></div>}
        <div className="event-admin-copy"><span className={`event-status ${item.status}`}>{item.status}</span><h2>{item.title}</h2><p>{new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.starts_at))} · {item.venue}{item.city ? `, ${item.city}` : ''}</p><small>{item.event_type} · {item.event_registrations?.[0]?.count || 0} registrations</small></div>
        <div className="event-actions"><button title="Registrations and attendance" onClick={() => viewRegistrations(item)}><Users size={16} /></button><button title="Edit event" onClick={() => { setEditing(item); setCreating(false) }}><Pencil size={16} /></button><button title="Delete event" onClick={() => deleteEvent(item)}><Trash2 size={16} /></button></div>
      </article>)}</div>
      {formEvent !== null && <div className="member-modal-backdrop"><section className="member-modal event-modal"><div className="panel-head"><div><p className="eyebrow">{editing ? 'Edit event' : 'New event'}</p><h2>{editing ? editing.title : 'Create an event'}</h2></div><button className="icon-button" aria-label="Close editor" onClick={() => { setEditing(null); setCreating(false) }}><X size={18} /></button></div><form onSubmit={saveEvent} encType="multipart/form-data">
        {editing && <input type="hidden" name="id" value={editing.id} />}<label>Title<input name="title" defaultValue={initialEvent(editing || undefined).title} required /></label><div className="form-row"><label>Event type<input name="event_type" defaultValue={initialEvent(editing || undefined).event_type} required /></label><label>Status<select name="status" defaultValue={initialEvent(editing || undefined).status}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select></label></div><label>Description<textarea name="description" rows={3} defaultValue={initialEvent(editing || undefined).description} /></label><div className="form-row"><label>Starts<input name="starts_at" type="datetime-local" defaultValue={initialEvent(editing || undefined).starts_at} required /></label><label>Ends<input name="ends_at" type="datetime-local" defaultValue={initialEvent(editing || undefined).ends_at} /></label></div><div className="form-row"><label>Venue<input name="venue" defaultValue={initialEvent(editing || undefined).venue} required /></label><label>City<input name="city" defaultValue={initialEvent(editing || undefined).city} /></label></div><label>Flyer image<input name="flyer" type="file" accept="image/*" /></label><label>Or flyer URL<input name="flyer_url" type="url" defaultValue={initialEvent(editing || undefined).flyer_url} placeholder="https://…" /></label><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => { setEditing(null); setCreating(false) }}>Cancel</button><button type="submit" className="button button-yellow">Save event</button></div>
      </form></section></div>}
      {registrations && <div className="member-modal-backdrop"><section className="member-modal"><div className="panel-head"><div><p className="eyebrow">Attendance</p><h2>{registrations.event.title}</h2></div><button className="icon-button" aria-label="Close attendance" onClick={() => setRegistrations(null)}><X size={18} /></button></div>{registrations.rows.length === 0 ? <p className="auth-muted">No registrations yet.</p> : <div className="registration-list">{registrations.rows.map((row) => <div className="registration-row" key={row.member_id}><div><strong>{row.profiles ? `${row.profiles.first_name} ${row.profiles.last_name}` : 'Member'}</strong><small>{row.profiles?.program || row.profiles?.contact_info || 'No details'}</small></div><select aria-label="Registration status" value={row.status} onChange={(event) => updateRegistration(row, event.target.value)}><option value="registered">Registered</option><option value="attended">Attended</option><option value="cancelled">Cancelled</option></select></div>)}</div>}</section></div>}
    </>
  )
}

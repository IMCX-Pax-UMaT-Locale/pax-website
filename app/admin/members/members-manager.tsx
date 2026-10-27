'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Download, Pencil, Search, ShieldCheck, Trash2, X } from 'lucide-react'

type Role = 'member' | 'alumni' | 'admin'
type Member = {
  id: string
  first_name: string
  last_name: string
  contact_info: string | null
  hostel: string | null
  program: string | null
  graduation_year: number | null
  role: Role
  is_active: boolean
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

type Filters = { search: string; role: string; status: string }

const emptyFilters: Filters = { search: '', role: 'all', status: 'all' }

function displayName(member: Member) {
  return `${member.first_name} ${member.last_name}`.trim() || 'Unnamed member'
}

function initials(member: Member) {
  return displayName(member).split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

export default function MembersManager({ currentUserId }: { currentUserId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [filters, setFilters] = useState(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [editing, setEditing] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const pageSize = 20
  const pages = Math.max(1, Math.ceil(total / pageSize))

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: page.toString(), ...appliedFilters })
    const response = await fetch(`/api/admin/members?${params}`)
    const result = await response.json() as { members?: Member[]; total?: number; error?: string }
    if (!response.ok) {
      setError(result.error || 'Unable to load members.')
      setLoading(false)
      return
    }
    setMembers(result.members || [])
    setTotal(result.total || 0)
    setLoading(false)
  }, [appliedFilters, page])

  useEffect(() => { loadMembers() }, [loadMembers])

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setAppliedFilters(filters)
  }

  async function saveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const year = String(form.get('graduation_year') || '').trim()
    const response = await fetch('/api/admin/members/invite', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editing.id,
        updates: {
          first_name: String(form.get('first_name') || '').trim(),
          last_name: String(form.get('last_name') || '').trim(),
          contact_info: String(form.get('contact_info') || '').trim() || null,
          hostel: String(form.get('hostel') || '').trim() || null,
          program: String(form.get('program') || '').trim() || null,
          graduation_year: year ? Number(year) : null,
          role: String(form.get('role') || 'member') as Role,
          is_active: form.get('is_active') === 'true',
        },
      }),
    })
    const result = await response.json() as { member?: Member; error?: string }
    if (!response.ok) {
      setError(result.error || 'Unable to save member.')
      return
    }
    setEditing(null)
    setMessage('Member profile updated.')
    await loadMembers()
  }

  async function removeMember(member: Member) {
    if (!window.confirm(`Remove ${displayName(member)} permanently? This also deletes their login account.`)) return
    setError('')
    const response = await fetch('/api/admin/members/invite', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id }),
    })
    const result = await response.json() as { error?: string }
    if (!response.ok) {
      setError(result.error || 'Unable to remove member.')
      return
    }
    setMessage('Member account removed.')
    await loadMembers()
  }

  async function promoteMember(member: Member) {
    if (!window.confirm(`Send ${displayName(member)} an administrator invitation? They will only become an administrator after accepting.`)) return
    setError('')
    setMessage('')
    const response = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id }),
    })
    const result = await response.json() as { error?: string }
    if (!response.ok) {
      setError(result.error || 'Unable to send administrator invitation.')
      return
    }
    setMessage(`Administrator invitation sent to ${displayName(member)}.`)
    await loadMembers()
  }

  return (
    <>
      <div className="member-toolbar">
        <form className="member-filters" onSubmit={submitFilters}>
          <label className="member-search"><Search size={16} /><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search name, programme, or contact" /></label>
          <select aria-label="Filter by role" value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
            <option value="all">All roles</option><option value="member">Members</option><option value="alumni">Alumni</option><option value="admin">Admins</option>
          </select>
          <select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
          <button className="button button-navy" type="submit">Search</button>
        </form>
        <a className="button button-ghost admin-export" href="/api/admin/members/export"><Download size={16} /> Export CSV</a>
      </div>

      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="member-admin-panel">
        <div className="member-admin-summary"><strong>{total}</strong> profiles found</div>
        {loading ? <p className="auth-muted">Loading members…</p> : members.length === 0 ? <p className="auth-muted">No members match these filters.</p> : (
          <div className="member-admin-table">
            <div className="member-admin-header"><span>Member</span><span>Programme</span><span>Role</span><span>Status</span><span>Joined</span><span /></div>
            {members.map((member) => <div className="member-admin-row" key={member.id}>
              <div className="member-identity"><span className="avatar">{initials(member)}</span><span><strong>{displayName(member)}</strong><small>{member.contact_info || 'No contact details'}</small></span></div>
              <span>{member.program || '—'}</span>
              <span className={`role-label ${member.role}`}>{member.role}</span>
              <span className={member.is_active ? 'member-active' : 'member-inactive'}>{member.is_active ? 'Active' : 'Inactive'}</span>
              <span>{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(member.created_at))}</span>
              <span className="member-row-actions"><button title="Invite to become administrator" aria-label={`Invite ${displayName(member)} to become an administrator`} disabled={member.role === 'admin'} onClick={() => promoteMember(member)}><ShieldCheck size={15} /></button><button title="Edit member" aria-label={`Edit ${displayName(member)}`} onClick={() => setEditing(member)}><Pencil size={15} /></button><button title="Remove member" aria-label={`Remove ${displayName(member)}`} disabled={member.id === currentUserId} onClick={() => removeMember(member)}><Trash2 size={15} /></button></span>
            </div>)}
          </div>
        )}
        <div className="member-pagination"><button className="button button-ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="button button-ghost" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button></div>
      </div>

      {editing && <div className="member-modal-backdrop"><section className="member-modal" role="dialog" aria-modal="true" aria-labelledby="edit-member-title">
        <div className="panel-head"><div><p className="eyebrow">Member profile</p><h2 id="edit-member-title">Edit {displayName(editing)}</h2></div><button className="icon-button" aria-label="Close editor" onClick={() => setEditing(null)}><X size={18} /></button></div>
        <form onSubmit={saveMember}>
          <div className="form-row"><label>First name<input name="first_name" defaultValue={editing.first_name} required /></label><label>Last name<input name="last_name" defaultValue={editing.last_name} required /></label></div>
          <div className="form-row"><label>Contact details<input name="contact_info" defaultValue={editing.contact_info || ''} /></label><label>Hostel<input name="hostel" defaultValue={editing.hostel || ''} /></label></div>
          <div className="form-row"><label>Programme<input name="program" defaultValue={editing.program || ''} /></label><label>Graduation year<input name="graduation_year" type="number" min="1950" max="2100" defaultValue={editing.graduation_year || ''} /></label></div>
          <div className="form-row"><label>Role<select name="role" defaultValue={editing.role}><option value="member">Member</option><option value="alumni">Alumni</option><option value="admin">Administrator</option></select></label><label>Account status<select name="is_active" defaultValue={editing.is_active ? 'true' : 'false'} disabled={editing.id === currentUserId}><option value="true">Active</option><option value="false">Inactive</option></select></label></div>
          <div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="button button-yellow">Save changes</button></div>
        </form>
      </section></div>}
    </>
  )
}

'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Download, Eye, X } from 'lucide-react'

type DonationStatus = 'pending' | 'paid' | 'failed' | 'refunded'
type Donor = { first_name: string; last_name: string; contact_info: string | null } | null
type Donation = { id: string; donor_id: string | null; amount: number; currency: string; status: DonationStatus; stripe_session_id: string | null; hubtel_reference: string | null; provider_response: Record<string, unknown> | null; created_at: string; updated_at: string; profiles: Donor }
type Summary = { paid: number; pending: number; failed: number; refunded: number; count: number }
type Filters = { search: string; status: string; from: string; to: string }

const initialFilters: Filters = { search: '', status: 'all', from: '', to: '' }
const money = (amount: number, currency: string) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100)

export default function DonationsManager() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [summary, setSummary] = useState<Record<string, Summary>>({})
  const [filters, setFilters] = useState(initialFilters)
  const [applied, setApplied] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Donation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const pageSize = 25
  const pages = Math.max(1, Math.ceil(total / pageSize))

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const response = await fetch(`/api/admin/donations?${new URLSearchParams({ page: page.toString(), ...applied })}`)
    const result = await response.json() as { donations?: Donation[]; summary?: Record<string, Summary>; total?: number; error?: string }
    if (!response.ok) setError(result.error || 'Unable to load donations.')
    else { setDonations(result.donations || []); setSummary(result.summary || {}); setTotal(result.total || 0) }
    setLoading(false)
  }, [applied, page])

  useEffect(() => { load() }, [load])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setApplied(filters)
  }

  async function updateStatus(donation: Donation, status: DonationStatus) {
    const response = await fetch('/api/admin/donations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: donation.id, status }) })
    const result = await response.json() as { error?: string }
    if (!response.ok) { setError(result.error || 'Unable to update donation.'); return }
    setMessage('Donation status updated.')
    setSelected(null)
    await load()
  }

  return (
    <>
      <div className="donation-summary-grid">{Object.entries(summary).map(([currency, values]) => <div className="donation-summary" key={currency}><span>{currency} giving</span><strong>{money(values.paid, currency)}</strong><small>{values.count} total records · {money(values.pending, currency)} pending</small></div>)}</div>
      <div className="donation-toolbar"><form className="donation-filters" onSubmit={submit}><input aria-label="Search payment reference" placeholder="Search payment reference" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /><select aria-label="Filter donation status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="all">All statuses</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select><label>From<input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label><label>To<input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label><button className="button button-navy" type="submit">Filter</button></form><a className="button button-ghost" href="/api/admin/donations/export"><Download size={16} /> Export CSV</a></div>
      {message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}
      <div className="donation-admin-panel"><div className="member-admin-summary"><strong>{total}</strong> donation records</div>{loading ? <p className="auth-muted">Loading donations…</p> : donations.length === 0 ? <p className="auth-muted">No donations match these filters.</p> : <div className="donation-table"><div className="donation-header"><span>Date</span><span>Donor</span><span>Amount</span><span>Status</span><span>Reference</span><span /></div>{donations.map((donation) => <div className="donation-row" key={donation.id}><span>{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(donation.created_at))}</span><span><strong>{donation.profiles ? `${donation.profiles.first_name} ${donation.profiles.last_name}`.trim() : 'Anonymous donor'}</strong><small>{donation.profiles?.contact_info || donation.currency.toUpperCase()}</small></span><strong>{money(Number(donation.amount), donation.currency)}</strong><span className={`donation-status ${donation.status}`}>{donation.status}</span><span className="donation-reference">{donation.hubtel_reference || donation.stripe_session_id || '—'}</span><button className="icon-button" title="View donation details" onClick={() => setSelected(donation)}><Eye size={16} /></button></div>)}</div>}<div className="member-pagination"><button className="button button-ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="button button-ghost" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
      {selected && <div className="member-modal-backdrop"><section className="member-modal donation-modal"><div className="panel-head"><div><p className="eyebrow">Payment record</p><h2>{money(Number(selected.amount), selected.currency)}</h2></div><button className="icon-button" aria-label="Close donation details" onClick={() => setSelected(null)}><X size={18} /></button></div><dl className="donation-details"><div><dt>Status</dt><dd className={`donation-status ${selected.status}`}>{selected.status}</dd></div><div><dt>Donor</dt><dd>{selected.profiles ? `${selected.profiles.first_name} ${selected.profiles.last_name}` : 'Anonymous donor'}</dd></div><div><dt>Created</dt><dd>{new Date(selected.created_at).toLocaleString()}</dd></div><div><dt>Hubtel reference</dt><dd>{selected.hubtel_reference || '—'}</dd></div><div><dt>Stripe session</dt><dd>{selected.stripe_session_id || '—'}</dd></div></dl><label className="donation-status-control">Reconcile status<select value={selected.status} onChange={(event) => updateStatus(selected, event.target.value as DonationStatus)}><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label>{selected.provider_response && <details><summary>Provider response</summary><pre>{JSON.stringify(selected.provider_response, null, 2)}</pre></details>}</section></div>}
    </>
  )
}

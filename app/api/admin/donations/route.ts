import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const statuses = ['pending', 'paid', 'failed', 'refunded'] as const
const fields = 'id, donor_id, amount, currency, status, stripe_session_id, hubtel_reference, provider_response, created_at, updated_at, profiles(first_name, last_name, contact_info)'

async function getAdmin() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'Authentication required.' }
  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  if (profile?.role !== 'admin' || profile.is_active === false) return { supabase, error: 'Administrator access required.' }
  return { supabase, error: null }
}

export async function GET(request: Request) {
  const { supabase, error } = await getAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const url = new URL(request.url)
  const search = (url.searchParams.get('search') || '').trim().replace(/[^a-zA-Z0-9@.+\- ]/g, '')
  const status = url.searchParams.get('status') || 'all'
  const fromDate = url.searchParams.get('from') || ''
  const toDate = url.searchParams.get('to') || ''
  const pageValue = Number.parseInt(url.searchParams.get('page') || '1', 10)
  const page = Number.isFinite(pageValue) ? Math.max(1, pageValue) : 1
  const pageSize = 25
  let query = supabase.from('donations').select(fields, { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1)
  if (statuses.includes(status as typeof statuses[number])) query = query.eq('status', status)
  if (fromDate) query = query.gte('created_at', `${fromDate}T00:00:00.000Z`)
  if (toDate) {
    const end = new Date(`${toDate}T00:00:00.000Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    query = query.lt('created_at', end.toISOString())
  }
  if (search) query = query.or(`hubtel_reference.ilike.%${search}%,stripe_session_id.ilike.%${search}%`)
  const { data, count, error: queryError } = await query
  if (queryError) return NextResponse.json({ error: 'Unable to load donations.' }, { status: 500 })
  const { data: totals, error: totalsError } = await supabase.from('donations').select('amount, currency, status')
  if (totalsError) return NextResponse.json({ error: 'Unable to calculate donation totals.' }, { status: 500 })
  const summary = (totals || []).reduce((result, donation) => {
    const currency = donation.currency.toUpperCase()
    result[currency] ||= { paid: 0, pending: 0, failed: 0, refunded: 0, count: 0 }
    if (donation.status in result[currency]) {
      result[currency][donation.status as 'paid' | 'pending' | 'failed' | 'refunded'] += Number(donation.amount)
    }
    result[currency].count += 1
    return result
  }, {} as Record<string, { paid: number; pending: number; failed: number; refunded: number; count: number }>)
  return NextResponse.json({ donations: data || [], total: count || 0, page, pageSize, summary })
}

export async function PATCH(request: Request) {
  const { supabase, error } = await getAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const body = await request.json().catch(() => null) as { id?: string; status?: string } | null
  if (!body?.id || !statuses.includes(body.status as typeof statuses[number])) return NextResponse.json({ error: 'A valid donation and status are required.' }, { status: 400 })
  const { data, error: updateError } = await supabase.from('donations').update({ status: body.status }).eq('id', body.id).select(fields).single()
  if (updateError) return NextResponse.json({ error: 'Unable to update donation status.' }, { status: 500 })
  return NextResponse.json({ donation: data })
}

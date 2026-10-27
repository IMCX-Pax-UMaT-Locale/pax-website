import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  if (profile?.role !== 'admin' || profile.is_active === false) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 })
  const { data, error } = await supabase.from('donations').select('id, donor_id, amount, currency, status, stripe_session_id, hubtel_reference, provider_response, created_at, updated_at').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Unable to export donations.' }, { status: 500 })
  const headers = ['id', 'donor_id', 'amount_minor_units', 'currency', 'status', 'stripe_session_id', 'hubtel_reference', 'provider_response', 'created_at', 'updated_at']
  const rows = (data || []).map((donation) => headers.map((header) => {
    const value = (donation as Record<string, unknown>)[header === 'amount_minor_units' ? 'amount' : header]
    return `"${(value == null ? '' : String(value)).replaceAll('"', '""')}"`
  }).join(','))
  return new NextResponse([headers.join(','), ...rows].join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="imcs-donations.csv"' } })
}

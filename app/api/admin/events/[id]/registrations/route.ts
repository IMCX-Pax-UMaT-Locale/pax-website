import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

async function adminClient() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'Authentication required.' }
  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  if (profile?.role !== 'admin' || profile.is_active === false) return { supabase, error: 'Administrator access required.' }
  return { supabase, error: null }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await adminClient()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const { id } = await context.params
  const { data, error: queryError } = await supabase.from('event_registrations').select('event_id, member_id, status, registered_at, attended_at, profiles(first_name, last_name, contact_info, program)').eq('event_id', id).order('registered_at', { ascending: false })
  if (queryError) return NextResponse.json({ error: 'Unable to load registrations.' }, { status: 500 })
  return NextResponse.json({ registrations: data || [] })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { supabase, error } = await adminClient()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const { id } = await context.params
  const body = await request.json().catch(() => null) as { member_id?: string; status?: string } | null
  if (!body?.member_id || !['registered', 'attended', 'cancelled'].includes(body.status || '')) return NextResponse.json({ error: 'A valid registration status is required.' }, { status: 400 })
  const updates = { status: body.status, attended_at: body.status === 'attended' ? new Date().toISOString() : null }
  const { error: updateError } = await supabase.from('event_registrations').update(updates).eq('event_id', id).eq('member_id', body.member_id)
  if (updateError) return NextResponse.json({ error: 'Unable to update registration.' }, { status: 500 })
  return NextResponse.json({ updated: true })
}

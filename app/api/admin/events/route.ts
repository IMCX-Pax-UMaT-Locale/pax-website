import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const fields = 'id, title, event_type, description, starts_at, ends_at, venue, city, flyer_url, status, created_at, updated_at, event_registrations(count)'
const statuses = ['draft', 'published', 'cancelled'] as const

async function adminContext() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'Authentication required.' }
  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  if (profile?.role !== 'admin' || profile.is_active === false) return { supabase, user: null, error: 'Administrator access required.' }
  return { supabase, user, error: null }
}

function text(value: FormDataEntryValue | null) {
  const result = typeof value === 'string' ? value.trim() : ''
  return result || null
}

function eventValues(form: FormData) {
  const title = text(form.get('title'))
  const startsAt = text(form.get('starts_at'))
  const venue = text(form.get('venue'))
  const status = text(form.get('status')) || 'draft'
  if (!title || !startsAt || !venue || !statuses.includes(status as typeof statuses[number])) return null
  const endsAt = text(form.get('ends_at'))
  const endDate = endsAt ? new Date(endsAt) : null
  if (endDate && Number.isNaN(endDate.getTime())) return null
  const year = new Date(startsAt)
  if (Number.isNaN(year.getTime())) return null
  return {
    title,
    event_type: text(form.get('event_type')) || 'Community',
    description: text(form.get('description')),
    starts_at: year.toISOString(),
    ends_at: endDate ? endDate.toISOString() : null,
    venue,
    city: text(form.get('city')),
    flyer_url: text(form.get('flyer_url')),
    status,
  }
}

async function uploadFlyer(supabase: ReturnType<typeof createClient>, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) throw new Error('Flyers must be images smaller than 5 MB.')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) throw new Error('Flyer upload is not configured.')
  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const { error } = await adminClient.storage.from('event-flyers').upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error('Unable to upload flyer.')
  return adminClient.storage.from('event-flyers').getPublicUrl(path).data.publicUrl
}

export async function GET(request: Request) {
  const { supabase, error } = await adminContext()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'all'
  let query = supabase.from('events').select(fields).order('starts_at', { ascending: true })
  if (statuses.includes(status as typeof statuses[number])) query = query.eq('status', status)
  const { data, error: queryError } = await query
  if (queryError) return NextResponse.json({ error: 'Unable to load events.' }, { status: 500 })
  return NextResponse.json({ events: data || [] })
}

export async function POST(request: Request) {
  const { supabase, user, error } = await adminContext()
  if (error || !user) return NextResponse.json({ error }, { status: 401 })
  const form = await request.formData()
  const values = eventValues(form)
  if (!values) return NextResponse.json({ error: 'Title, start time, venue, and valid status are required.' }, { status: 400 })
  try {
    const flyerUrl = await uploadFlyer(supabase, form.get('flyer'))
    const { data, error: insertError } = await supabase.from('events').insert({ ...values, flyer_url: flyerUrl || values.flyer_url, created_by: user.id }).select(fields).single()
    if (insertError) return NextResponse.json({ error: 'Unable to create event.' }, { status: 500 })
    return NextResponse.json({ event: data }, { status: 201 })
  } catch (uploadError) {
    return NextResponse.json({ error: uploadError instanceof Error ? uploadError.message : 'Unable to upload flyer.' }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const { supabase, error } = await adminContext()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const form = await request.formData()
  const id = text(form.get('id'))
  const values = eventValues(form)
  if (!id || !values) return NextResponse.json({ error: 'A valid event and event details are required.' }, { status: 400 })
  try {
    const flyerUrl = await uploadFlyer(supabase, form.get('flyer'))
    const updates = { ...values, flyer_url: flyerUrl || values.flyer_url }
    const { data, error: updateError } = await supabase.from('events').update(updates).eq('id', id).select(fields).single()
    if (updateError) return NextResponse.json({ error: 'Unable to update event.' }, { status: 500 })
    return NextResponse.json({ event: data })
  } catch (uploadError) {
    return NextResponse.json({ error: uploadError instanceof Error ? uploadError.message : 'Unable to upload flyer.' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const { supabase, error } = await adminContext()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const body = await request.json().catch(() => null) as { id?: string } | null
  if (!body?.id) return NextResponse.json({ error: 'An event is required.' }, { status: 400 })
  const { error: deleteError } = await supabase.from('events').delete().eq('id', body.id)
  if (deleteError) return NextResponse.json({ error: 'Unable to delete event.' }, { status: 500 })
  return NextResponse.json({ deleted: true })
}

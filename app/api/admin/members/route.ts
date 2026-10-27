import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const profileFields = 'id, first_name, last_name, contact_info, hostel, program, graduation_year, role, is_active, onboarding_complete, created_at, updated_at'
const roles = ['member', 'alumni', 'admin'] as const

type ProfileRole = (typeof roles)[number]

type MemberUpdate = {
  first_name?: string
  last_name?: string
  contact_info?: string | null
  hostel?: string | null
  program?: string | null
  graduation_year?: number | null
  role?: ProfileRole
  is_active?: boolean
}

async function getAdminContext() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'Authentication required.' }

  const { data: profile, error } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  if (error || profile?.role !== 'admin' || profile.is_active === false) {
    return { supabase, user: null, error: 'Administrator access required.' }
  }

  return { supabase, user, error: null }
}

export async function GET(request: Request) {
  const { supabase, error } = await getAdminContext()
  if (error) return NextResponse.json({ error }, { status: 401 })

  const url = new URL(request.url)
  const search = (url.searchParams.get('search')?.trim() || '').replace(/[^a-zA-Z0-9@.+\- ]/g, '')
  const role = url.searchParams.get('role') || 'all'
  const status = url.searchParams.get('status') || 'all'
  const requestedPage = Number.parseInt(url.searchParams.get('page') || '1', 10)
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1
  const pageSize = 20
  const from = (page - 1) * pageSize

  let query = supabase.from('profiles').select(profileFields, { count: 'exact' }).order('created_at', { ascending: false }).range(from, from + pageSize - 1)
  if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,contact_info.ilike.%${search}%,program.ilike.%${search}%`)
  if (roles.includes(role as ProfileRole)) query = query.eq('role', role)
  if (status === 'active') query = query.eq('is_active', true)
  if (status === 'inactive') query = query.eq('is_active', false)

  const { data, count, error: queryError } = await query
  if (queryError) return NextResponse.json({ error: 'Unable to load members.' }, { status: 500 })
  return NextResponse.json({ members: data || [], total: count || 0, page, pageSize })
}

export async function PATCH(request: Request) {
  const { supabase, user, error } = await getAdminContext()
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const body = await request.json().catch(() => null) as { id?: string; updates?: MemberUpdate } | null
  if (!body?.id || !body.updates || Object.keys(body.updates).length === 0) {
    return NextResponse.json({ error: 'A member and at least one update are required.' }, { status: 400 })
  }

  if (body.id === user.id && (body.updates.role && body.updates.role !== 'admin' || body.updates.is_active === false)) {
    return NextResponse.json({ error: 'You cannot remove your own administrator access.' }, { status: 400 })
  }

  const updates = { ...body.updates }
  if (updates.role && !roles.includes(updates.role)) return NextResponse.json({ error: 'Invalid member role.' }, { status: 400 })
  if (updates.graduation_year != null && (!Number.isInteger(updates.graduation_year) || updates.graduation_year < 1950 || updates.graduation_year > 2100)) {
    return NextResponse.json({ error: 'Graduation year must be between 1950 and 2100.' }, { status: 400 })
  }

  const { data, error: updateError } = await supabase.from('profiles').update(updates).eq('id', body.id).select(profileFields).single()
  if (updateError) return NextResponse.json({ error: 'Unable to update member.' }, { status: 500 })
  return NextResponse.json({ member: data })
}

export async function DELETE(request: Request) {
  const { user, error } = await getAdminContext()
  if (error || !user) return NextResponse.json({ error }, { status: 401 })

  const body = await request.json().catch(() => null) as { id?: string } | null
  if (!body?.id || body.id === user.id) return NextResponse.json({ error: 'A different member account is required.' }, { status: 400 })

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) return NextResponse.json({ error: 'Account removal is not configured.' }, { status: 503 })

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(body.id)
  if (deleteError) return NextResponse.json({ error: 'Unable to remove member account.' }, { status: 500 })
  return NextResponse.json({ removed: true })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

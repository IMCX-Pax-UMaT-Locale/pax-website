import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const settingKeys = ['announcement_text', 'organization_name', 'contact_email', 'contact_phone', 'address', 'social_facebook', 'social_instagram'] as const
type SettingKey = (typeof settingKeys)[number]

async function getAdmin() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'Authentication required.' }
  const { data: profile } = await supabase.from('profiles').select('role, is_active, first_name, last_name, contact_info').eq('id', user.id).single()
  if (profile?.role !== 'admin' || profile.is_active === false) return { supabase, user: null, error: 'Administrator access required.' }
  return { supabase, user, profile, error: null }
}

export async function GET() {
  const { supabase, user, profile, error } = await getAdmin()
  if (error || !user) return NextResponse.json({ error }, { status: 401 })
  const { data, error: settingsError } = await supabase.from('site_settings').select('key, value')
  if (settingsError) return NextResponse.json({ error: 'Unable to load settings.' }, { status: 500 })
  const settings = Object.fromEntries((data || []).map((item) => [item.key, item.value]))
  return NextResponse.json({ settings, profile })
}

export async function PATCH(request: Request) {
  const { supabase, user, error } = await getAdmin()
  if (error || !user) return NextResponse.json({ error }, { status: 401 })
  const body = await request.json().catch(() => null) as { settings?: Partial<Record<SettingKey, string>>; profile?: { first_name?: string; last_name?: string; contact_info?: string | null } } | null
  if (!body || (!body.settings && !body.profile)) return NextResponse.json({ error: 'Settings or profile updates are required.' }, { status: 400 })

  if (body.profile) {
    const profileUpdates = {
      first_name: body.profile.first_name?.trim(),
      last_name: body.profile.last_name?.trim(),
      contact_info: body.profile.contact_info?.trim() || null,
    }
    if (!profileUpdates.first_name || !profileUpdates.last_name) return NextResponse.json({ error: 'First and last name are required.' }, { status: 400 })
    const { error: profileError } = await supabase.from('profiles').update(profileUpdates).eq('id', user.id)
    if (profileError) return NextResponse.json({ error: 'Unable to update administrator profile.' }, { status: 500 })
  }

  if (body.settings) {
    const rows = Object.entries(body.settings)
      .filter(([key, value]) => settingKeys.includes(key as SettingKey) && typeof value === 'string')
      .map(([key, value]) => ({ key, value: (value as string).trim(), updated_by: user.id }))
    if (rows.length > 0) {
      const { error: settingsError } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' })
      if (settingsError) return NextResponse.json({ error: 'Unable to update site settings.' }, { status: 500 })
    }
  }
  return NextResponse.json({ saved: true })
}

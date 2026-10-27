import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient(await cookies())
  const { data, error } = await supabase.from('site_settings').select('key, value').in('key', ['announcement_text', 'organization_name', 'contact_email', 'contact_phone', 'address', 'social_facebook', 'social_instagram'])
  if (error) return NextResponse.json({ error: 'Unable to load site settings.' }, { status: 500 })
  return NextResponse.json({ settings: Object.fromEntries((data || []).map((item) => [item.key, item.value])) }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
}

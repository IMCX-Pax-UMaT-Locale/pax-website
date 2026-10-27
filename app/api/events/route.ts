import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient(await cookies())
  const { data, error } = await supabase.from('events').select('id, title, event_type, description, starts_at, ends_at, venue, city, flyer_url').eq('status', 'published').gte('starts_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(12)
  if (error) return NextResponse.json({ error: 'Unable to load events.' }, { status: 500 })
  return NextResponse.json({ events: data || [] }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
}

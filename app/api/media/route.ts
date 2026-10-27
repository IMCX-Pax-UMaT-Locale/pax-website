import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient(await cookies())
  const { data, error } = await supabase.from('media_assets').select('id, title, image_url, alt_text, sort_order').eq('is_published', true).order('sort_order').order('created_at', { ascending: false }).limit(12)
  if (error) return NextResponse.json({ error: 'Unable to load media.' }, { status: 500 })
  return NextResponse.json({ media: data || [] }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
}

import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/supabase/config'

export async function GET() {
  const { url, key } = getSupabaseConfig()

  if (!url || !key) {
    console.error('[Supabase] Connection check failed: missing URL or publishable key')
    return NextResponse.json({ connected: false, error: 'Supabase configuration is missing' }, { status: 500 })
  }

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
  headers: { apikey: key },
  cache: 'no-store',
})

    if (!response.ok) {
      console.error(`[Supabase] Connection check failed: HTTP ${response.status}`)
      return NextResponse.json({ connected: false, error: `Supabase returned HTTP ${response.status}` }, { status: 502 })
    }

    console.info('[Supabase] Database connection successful')
    return NextResponse.json({ connected: true })
  } catch (error) {
    console.error('[Supabase] Connection check failed:', error)
    return NextResponse.json({ connected: false, error: 'Supabase is unreachable' }, { status: 503 })
  }
}

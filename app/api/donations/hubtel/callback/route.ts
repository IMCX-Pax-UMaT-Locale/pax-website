import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type DonationCallback = {
  amount?: number
  clientReference?: string
  status?: 'paid' | 'failed'
  response?: unknown
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as DonationCallback | null
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey || !body?.clientReference || !body.amount || !body.status) {
    return NextResponse.json({ error: 'Invalid Hubtel callback.' }, { status: 400 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await supabase.from('donations').upsert(
    {
      amount: body.amount,
      currency: 'ghs',
      status: body.status,
      hubtel_reference: body.clientReference,
      provider_response: body.response ?? null,
    },
    { onConflict: 'hubtel_reference' },
  )

  if (error) {
    console.error('[Hubtel] Could not save donation callback:', error)
    return NextResponse.json({ error: 'Could not save donation.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const clientReference = url.searchParams.get('clientReference')
  if (!clientReference) return NextResponse.json({ error: 'Missing client reference.' }, { status: 400 })
  return NextResponse.json({ received: true, clientReference })
}

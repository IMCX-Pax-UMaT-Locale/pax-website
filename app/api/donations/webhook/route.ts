import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get('stripe-signature')
  if (!secret || !signature) return NextResponse.json({ error: 'Missing webhook configuration.' }, { status: 400 })
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-07-29.dahlia' })
  const payload = await request.text()
  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(payload, signature, secret) } catch { return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 }) }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status === 'paid' && session.amount_total && session.id) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
      await supabase.from('donations').upsert({ amount: session.amount_total, currency: session.currency || 'ngn', status: 'paid', stripe_session_id: session.id }, { onConflict: 'stripe_session_id' })
    }
  }
  return NextResponse.json({ received: true })
}

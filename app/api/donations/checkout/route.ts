import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-07-29.dahlia',
  })

  const body = await request.json().catch(() => null)
  const amount = Number(body?.amount)

  if (!Number.isInteger(amount) || amount < 100 || amount > 100000000) {
    return NextResponse.json({ error: 'Enter a valid donation amount.' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'ngn',
          product_data: {
            name: 'IMCS-PAX Romana donation',
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${new URL(request.url).origin}/donate?success=1`,
    cancel_url: `${new URL(request.url).origin}/donate?canceled=1`,
    integration_identifier: `imcs-donation-${Math.random().toString(36).slice(2, 10)}`,
  })

  return NextResponse.json({ url: session.url })
}

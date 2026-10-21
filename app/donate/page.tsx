'use client'

import { useState } from 'react'
import { ArrowRight, HeartHandshake, Loader2 } from 'lucide-react'
import CheckoutSdk, { type PaymentFailure, type PaymentSuccess } from '@hubteljs/checkout'

const defaultAmounts = ['50', '100', '250', '500']

function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('233')) return digits
  if (digits.startsWith('0')) return `233${digits.slice(1)}`
  return digits
}

export default function DonatePage() {
  const [amount, setAmount] = useState('100')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function recordPayment(
    clientReference: string,
    status: 'paid' | 'failed',
    data: PaymentSuccess | PaymentFailure,
  ) {
    const response = await fetch('/api/donations/hubtel/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount) * 100,
        clientReference,
        status,
        response: data,
      }),
    })

    if (!response.ok) {
      throw new Error('We could not record the payment status.')
    }
  }

  function donate() {
    setError('')
    const numericAmount = Number(amount)
    const normalizedPhone = normalizePhoneNumber(phoneNumber)

    if (!Number.isInteger(numericAmount) || numericAmount < 1 || numericAmount > 100000) {
      setError('Enter a donation amount between GH₵1 and GH₵100,000.')
      return
    }

    if (!/^233(?:20|23|24|25|26|27|50|54|55|59)\d{7}$/.test(normalizedPhone)) {
      setError('Enter a valid Ghana phone number, for example 0241234567.')
      return
    }

    const merchantAccount = Number(process.env.NEXT_PUBLIC_HUBTEL_MERCHANT_ACCOUNT)
    const basicAuth = process.env.NEXT_PUBLIC_HUBTEL_BASIC_AUTH
    const callbackUrl = process.env.NEXT_PUBLIC_HUBTEL_CALLBACK_URL || `${window.location.origin}/api/donations/hubtel/callback`

    if (!merchantAccount || !basicAuth) {
      setError('Hubtel checkout is not configured. Please contact the administrator.')
      return
    }

    setLoading(true)
    const clientReference = `imcs-donation-${crypto.randomUUID()}`
    const checkout = new CheckoutSdk()

    checkout.openModal({
      purchaseInfo: {
        amount: numericAmount,
        purchaseDescription: `IMCS-PAX Romana donation of GHS ${numericAmount.toFixed(2)}`,
        customerPhoneNumber: normalizedPhone,
        clientReference,
      },
      config: {
        branding: 'enabled',
        callbackUrl,
        merchantAccount,
        basicAuth,
      },
      callBacks: {
        onPaymentSuccess: async (data) => {
          try {
            await recordPayment(clientReference, 'paid', data)
          } catch (paymentError) {
            console.error('[Hubtel] Could not record successful payment:', paymentError)
            setError('Payment succeeded, but we could not update the donation record.')
          } finally {
            setLoading(false)
            checkout.closePopUp()
          }
        },
        onPaymentFailure: async (data) => {
          try {
            await recordPayment(clientReference, 'failed', data)
          } catch (paymentError) {
            console.error('[Hubtel] Could not record failed payment:', paymentError)
          } finally {
            setError(data.message || 'The payment was not completed.')
            setLoading(false)
          }
        },
        onClose: () => setLoading(false),
      },
    })
  }

  return (
    <main className="auth-page">
      <a className="auth-back" href="/">← Back to home</a>
      <div className="donate-shell">
        <div className="donate-copy">
          <HeartHandshake size={34} />
          <p className="eyebrow light">Give with purpose</p>
          <h1>Keep the movement moving.</h1>
          <p>Your gift supports formation, community events, outreach, and the work of building a more peaceful world.</p>
        </div>
        <div className="donate-card">
          <p className="eyebrow">Make a donation</p>
          <h2>Choose your amount.</h2>
          <div className="amounts">
            {defaultAmounts.map((value) => (
              <button className={amount === value ? 'amount active' : 'amount'} key={value} onClick={() => setAmount(value)}>
                GH₵{Number(value).toLocaleString('en-GH')}
              </button>
            ))}
          </div>
          <label>
            Custom amount
            <input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
          </label>
          <label>
            Ghana phone number
            <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="0241234567" inputMode="tel" autoComplete="tel" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-yellow submit-button" onClick={donate} disabled={loading}>
            {loading ? <Loader2 className="spin" size={16} /> : <>Continue to Hubtel checkout <ArrowRight size={16} /></>}
          </button>
          <small className="secure-note">Secure payment powered by Hubtel.</small>
        </div>
      </div>
    </main>
  )
}

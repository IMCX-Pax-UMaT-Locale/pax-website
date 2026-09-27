'use client'

import { useState } from 'react'
import { ArrowRight, HeartHandshake, Loader2 } from 'lucide-react'

const defaultAmounts = ['5000', '10000', '25000', '50000']

export default function DonatePage() {
  const [amount, setAmount] = useState('10000')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function donate() {
    setLoading(true)
    setError('')

    const response = await fetch('/api/donations/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(amount) * 100,
      }),
    })

    const data = await response.json()

    if (data.url) {
      window.location.href = data.url
      return
    }

    setError(data.error || 'Unable to start checkout.')
    setLoading(false)
  }

  return (
    <main className="auth-page">
      <a className="auth-back" href="/">
        ← Back to home
      </a>

      <div className="donate-shell">
        <div className="donate-copy">
          <HeartHandshake size={34} />
          <p className="eyebrow light">Give with purpose</p>
          <h1>Keep the movement moving.</h1>
          <p>
            Your gift supports formation, community events, outreach, and the work of building a more peaceful world.
          </p>
        </div>

        <div className="donate-card">
          <p className="eyebrow">Make a donation</p>
          <h2>Choose your amount.</h2>

          <div className="amounts">
            {defaultAmounts.map((value) => (
              <button
                className={amount === value ? 'amount active' : 'amount'}
                key={value}
                onClick={() => setAmount(value)}
              >
                ₦{Number(value).toLocaleString()}
              </button>
            ))}
          </div>

          <label>
            Custom amount
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="button button-yellow submit-button" onClick={donate} disabled={loading}>
            {loading ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <>
                Continue to secure checkout <ArrowRight size={16} />
              </>
            )}
          </button>

          <small className="secure-note">Secure payment powered by Stripe.</small>
        </div>
      </div>
    </main>
  )
}

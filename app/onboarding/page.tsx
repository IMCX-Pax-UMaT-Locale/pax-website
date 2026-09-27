'use client'

import { FormEvent, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [chapter, setChapter] = useState('')
  const [city, setCity] = useState('')
  const [program, setProgram] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [error, setError] = useState('')

  async function continueStep(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (step < 3) {
      setStep((value) => value + 1)
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const year = Number(graduationYear)
    const role = year && new Date().getFullYear() - year >= 4 ? 'alumni' : 'member'

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        program,
        graduation_year: year,
        onboarding_complete: true,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      setError('We could not save your profile. Please try again.')
      return
    }

    window.location.href = '/member'
  }

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <>
          <h2>Your community.</h2>
          <p className="auth-muted">Tell us where you are joining from.</p>

          <label>
            Chapter or parish
            <input
              required
              value={chapter}
              onChange={(event) => setChapter(event.target.value)}
              placeholder="e.g. Lagos Chapter"
            />
          </label>

          <label>
            City
            <input
              required
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="e.g. Lagos"
            />
          </label>
        </>
      )
    }

    if (step === 2) {
      return (
        <>
          <h2>Your formation.</h2>
          <p className="auth-muted">This helps us apply the four-year alumni rule accurately.</p>

          <label>
            Program of study
            <input
              required
              value={program}
              onChange={(event) => setProgram(event.target.value)}
              placeholder="e.g. Law"
            />
          </label>

          <label>
            Graduation year
            <input
              required
              min="1950"
              max="2100"
              type="number"
              value={graduationYear}
              onChange={(event) => setGraduationYear(event.target.value)}
              placeholder="2026"
            />
          </label>
        </>
      )
    }

    return (
      <div className="success-state">
        <Check size={42} />
        <h2>You&apos;re all set.</h2>
        <p>
          Your profile is ready. Explore events, meet your executives, and find your place in the movement.
        </p>
      </div>
    )
  }

  return (
    <main className="auth-page">
      <a className="auth-back" href="/">
        ← Back to home
      </a>

      <div className="auth-shell">
        <div className="auth-intro">
          <p className="eyebrow light">Member onboarding</p>
          <h1>Let&apos;s get to know you.</h1>
          <p>
            A few details help us connect you with the right community, events, and service opportunities.
          </p>

          <div className="onboarding-steps">
            <span className={step >= 1 ? 'current' : ''}>1</span>
            <i />
            <span className={step >= 2 ? 'current' : ''}>2</span>
            <i />
            <span className={step >= 3 ? 'current' : ''}>3</span>
          </div>
        </div>

        <div className="auth-card">
          <form onSubmit={continueStep}>
            <p className="eyebrow">Step {step} of 3</p>

            {renderStepContent()}

            {error && <p className="form-error">{error}</p>}

            <button className="button button-yellow submit-button" type="submit">
              {step === 3 ? 'Enter member space' : 'Continue'} <ArrowRight size={16} />
            </button>
          </form>

          {step < 3 && <p className="auth-footer">You can update these details later.</p>}
        </div>
      </div>
    </main>
  )
}

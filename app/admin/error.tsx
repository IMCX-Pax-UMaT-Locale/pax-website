'use client'

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="admin-page">
      <div className="admin-error-state">
        <p className="eyebrow">Admin console</p>
        <h1>Something went wrong.</h1>
        <p>We could not load this admin page. Try again, or return to the dashboard.</p>
        <div className="admin-error-actions">
          <button className="button button-yellow" onClick={reset}>Try again</button>
          <a className="button button-ghost" href="/admin">Back to dashboard</a>
        </div>
      </div>
    </main>
  )
}

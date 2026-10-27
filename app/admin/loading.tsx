export default function AdminLoading() {
  return (
    <main className="admin-page">
      <div className="admin-loading" role="status" aria-live="polite">
        <span className="admin-loading-spinner" />
        Loading admin console…
      </div>
    </main>
  )
}

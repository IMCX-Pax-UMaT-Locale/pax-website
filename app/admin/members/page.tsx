import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MembersManager from './members-manager'
import AdminHeader from '../admin-header'

export default async function AdminMembersPage() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  if (profile?.role !== 'admin' || profile.is_active === false) redirect('/member')

  return (
    <main className="admin-page">
      <AdminHeader email={user.email} />
      <div className="admin-layout">
        <aside className="admin-nav">
          <span className="portal-label">Manage</span>
          <a href="/admin">Overview</a>
          <a className="selected" href="/admin/members">Members &amp; alumni</a>
          <a href="/admin#events">Events &amp; flyers</a>
          <a href="/admin#media">Media carousel</a>
          <a href="/admin#donations">Donations</a>
          <a href="/admin/settings">Settings</a>
        </aside>
        <section className="admin-content">
          <p className="eyebrow">People</p>
          <h1>Members &amp; alumni</h1>
          <p className="admin-intro">Search the community, keep profiles current, and manage membership access.</p>
          <MembersManager currentUserId={user.id} />
        </section>
      </div>
    </main>
  )
}

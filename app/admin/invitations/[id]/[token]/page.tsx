import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import InvitationResponse from './invitation-response'

export default async function AdminInvitationPage({ params, searchParams }: { params: Promise<{ id: string; token: string }>; searchParams: Promise<{ expires?: string }> }) {
  const { id, token } = await params
  const { expires } = await searchParams
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  return <InvitationResponse invitationId={id} token={token} expires={expires || ''} signedInEmail={user?.email || null} />
}

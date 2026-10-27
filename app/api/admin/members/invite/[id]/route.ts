import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function validSignature(id: string, expiresAt: string, signature: string) {
  const secret = process.env.ADMIN_INVITATION_SECRET
  if (!secret) return false
  const expected = createHmac('sha256', secret).update(`${id}.${expiresAt}`).digest('hex')
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const url = new URL(request.url)
  const expiresAt = url.searchParams.get('expires') || ''
  const signature = url.searchParams.get('token') || ''
  if (!expiresAt || !signature || new Date(expiresAt) <= new Date() || !validSignature(id, expiresAt, signature)) return NextResponse.json({ error: 'This invitation is invalid or expired.' }, { status: 400 })

  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in with the invited member account to respond.' }, { status: 403 })
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) return NextResponse.json({ error: 'Invitation service is not configured.' }, { status: 503 })
  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: invitation, error: invitationError } = await adminClient.from('admin_invitations').select('id, member_id, status, expires_at').eq('id', id).single()
  if (invitationError || invitation.status !== 'pending' || new Date(invitation.expires_at) <= new Date() || invitation.member_id !== user.id) return NextResponse.json({ error: 'This invitation is no longer available for this account.' }, { status: 410 })

  const body = await request.json().catch(() => null) as { decision?: string } | null
  if (body?.decision !== 'accepted' && body?.decision !== 'declined') return NextResponse.json({ error: 'A valid decision is required.' }, { status: 400 })
  if (body.decision === 'accepted') {
    const { error: promoteError } = await adminClient.from('profiles').update({ role: 'admin', is_active: true }).eq('id', user.id)
    if (promoteError) return NextResponse.json({ error: 'Unable to accept administrator invitation.' }, { status: 500 })
  }
  const { error: updateError } = await adminClient.from('admin_invitations').update({ status: body.decision, responded_at: new Date().toISOString() }).eq('id', id).eq('status', 'pending')
  if (updateError) return NextResponse.json({ error: 'Unable to record invitation response.' }, { status: 500 })
  return NextResponse.json({ responded: true, accepted: body.decision === 'accepted' })
}

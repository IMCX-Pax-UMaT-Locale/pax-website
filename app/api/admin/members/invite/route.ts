import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac } from 'node:crypto'
import { Resend } from 'resend'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function signInvitation(id: string, expiresAt: string) {
  const secret = process.env.ADMIN_INVITATION_SECRET
  if (!secret) throw new Error('ADMIN_INVITATION_SECRET is not configured.')
  return createHmac('sha256', secret).update(`${id}.${expiresAt}`).digest('hex')
}

async function getAdmin() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'Authentication required.' }
  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  if (profile?.role !== 'admin' || profile.is_active === false) {
    return { supabase, user: null, error: 'Administrator access required.' }
  }
  return { supabase, user, error: null }
}

export async function POST(request: Request) {
  const { supabase, user, error } = await getAdmin()
  if (error || !user) return NextResponse.json({ error }, { status: 401 })
  const body = await request.json().catch(() => null) as { id?: string } | null
  if (!body?.id || body.id === user.id) return NextResponse.json({ error: 'A different member is required.' }, { status: 400 })

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const resendKey = process.env.RESEND_API_KEY
  const sender = process.env.ADMIN_INVITATION_FROM || 'achillesmann03@gmail.com'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  if (!serviceRoleKey || !supabaseUrl || !resendKey) return NextResponse.json({ error: 'Invitation email is not configured on the server.' }, { status: 503 })

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: target, error: targetError } = await supabase.from('profiles').select('id, first_name, last_name, role, is_active').eq('id', body.id).single()
  if (targetError || !target) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  if (target.role === 'admin' && target.is_active) return NextResponse.json({ error: 'This member is already an active administrator.' }, { status: 409 })

  const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(body.id)
  if (authError || !authUser.user.email) return NextResponse.json({ error: 'This member does not have a usable email address.' }, { status: 400 })

  const { data: existing } = await supabase.from('admin_invitations').select('id').eq('member_id', body.id).eq('status', 'pending').gt('expires_at', new Date().toISOString()).maybeSingle()
  if (existing) return NextResponse.json({ error: 'This member already has a pending administrator invitation.' }, { status: 409 })

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: invitation, error: invitationError } = await supabase.from('admin_invitations').insert({
    member_id: body.id,
    invited_by: user.id,
    email: authUser.user.email,
    expires_at: expiresAt,
  }).select('id').single()
  if (invitationError || !invitation) return NextResponse.json({ error: 'Unable to create administrator invitation.' }, { status: 500 })

  const token = signInvitation(invitation.id, expiresAt)
  const inviteUrl = `${siteUrl}/admin/invitations/${invitation.id}/${token}?expires=${encodeURIComponent(expiresAt)}`
  const resend = new Resend(resendKey)
  const { error: emailError } = await resend.emails.send({
    from: sender,
    to: [authUser.user.email],
    subject: 'Invitation to become an IMCS-PAX Romana administrator',
    html: `<p>Hello ${target.first_name || 'there'},</p><p>You have been invited to become an administrator of the IMCS-PAX Romana platform.</p><p>Accepting will give you access to manage members, events, media, donations, and settings.</p><p><a href="${inviteUrl}">Review administrator invitation</a></p><p>This invitation expires in 7 days. If you did not expect this message, you can ignore it.</p>`,
  })
  if (emailError) {
    await supabase.from('admin_invitations').delete().eq('id', invitation.id)
    console.error('[Admin invitation] Could not send email:', emailError)
    return NextResponse.json({ error: 'Unable to send administrator invitation.' }, { status: 502 })
  }
  return NextResponse.json({ sent: true })
}

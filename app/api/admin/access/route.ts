import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ allowed: false, error: 'Your sign-in session was not established. Please try again.' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'admin') {
    return NextResponse.json({ allowed: false, error: 'This account is not marked as an administrator in the database.' }, { status: 403 })
  }

  if (profile.is_active === false) {
    return NextResponse.json({ allowed: false, error: 'This administrator account is inactive.' }, { status: 403 })
  }

  return NextResponse.json({ allowed: true })
}

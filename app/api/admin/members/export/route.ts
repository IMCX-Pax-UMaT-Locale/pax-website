import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { data: admin } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  if (admin?.role !== 'admin' || admin.is_active === false) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 })

  const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, contact_info, hostel, program, graduation_year, role, is_active, onboarding_complete, created_at').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Unable to export members.' }, { status: 500 })

  const headers = ['id', 'first_name', 'last_name', 'contact_info', 'hostel', 'program', 'graduation_year', 'role', 'is_active', 'onboarding_complete', 'created_at']
  const rows = (data || []).map((member) => headers.map((header) => (member as Record<string, unknown>)[header]).map((value) => `"${value == null ? '' : String(value).replaceAll('"', '""')}"`).join(','))
  return new NextResponse([headers.join(','), ...rows].join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="imcs-members.csv"',
    },
  })
}

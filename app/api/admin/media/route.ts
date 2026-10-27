import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const fields = 'id, title, image_url, alt_text, sort_order, is_published, created_at, updated_at'

async function getAdmin() {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'Authentication required.' }
  const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', user.id).single()
  if (profile?.role !== 'admin' || profile.is_active === false) return { supabase, error: 'Administrator access required.' }
  return { supabase, user, error: null }
}

function value(form: FormData, key: string) {
  const item = form.get(key)
  return typeof item === 'string' ? item.trim() : ''
}

async function uploadImage(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null
  if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) throw new Error('Images must be smaller than 8 MB.')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) throw new Error('Media upload is not configured.')
  const admin = createAdminClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const { error } = await admin.storage.from('media-assets').upload(path, file, { contentType: file.type })
  if (error) throw new Error('Unable to upload image.')
  return admin.storage.from('media-assets').getPublicUrl(path).data.publicUrl
}

export async function GET() {
  const { supabase, error } = await getAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const { data, error: queryError } = await supabase.from('media_assets').select(fields).order('sort_order').order('created_at', { ascending: false })
  if (queryError) return NextResponse.json({ error: 'Unable to load media.' }, { status: 500 })
  return NextResponse.json({ media: data || [] })
}

export async function POST(request: Request) {
  const { supabase, user, error } = await getAdmin()
  if (error || !user) return NextResponse.json({ error }, { status: 401 })
  const form = await request.formData()
  const title = value(form, 'title')
  const altText = value(form, 'alt_text')
  const imageUrl = value(form, 'image_url')
  if (!title || !altText) return NextResponse.json({ error: 'Title and alt text are required.' }, { status: 400 })
  try {
    const uploadedUrl = await uploadImage(form.get('image'))
    if (!uploadedUrl && !imageUrl) return NextResponse.json({ error: 'Upload an image or provide an image URL.' }, { status: 400 })
    const { data, error: insertError } = await supabase.from('media_assets').insert({ title, alt_text: altText, image_url: uploadedUrl || imageUrl, sort_order: Number(value(form, 'sort_order') || 0), is_published: value(form, 'is_published') === 'true', created_by: user.id }).select(fields).single()
    if (insertError) return NextResponse.json({ error: 'Unable to create media asset.' }, { status: 500 })
    return NextResponse.json({ media: data }, { status: 201 })
  } catch (uploadError) {
    return NextResponse.json({ error: uploadError instanceof Error ? uploadError.message : 'Unable to upload image.' }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const { supabase, error } = await getAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const form = await request.formData()
  const id = value(form, 'id')
  const title = value(form, 'title')
  const altText = value(form, 'alt_text')
  if (!id || !title || !altText) return NextResponse.json({ error: 'Asset, title, and alt text are required.' }, { status: 400 })
  try {
    const uploadedUrl = await uploadImage(form.get('image'))
    const imageUrl = uploadedUrl || value(form, 'image_url')
    const updates = { title, alt_text: altText, image_url: imageUrl, sort_order: Number(value(form, 'sort_order') || 0), is_published: value(form, 'is_published') === 'true' }
    const { data, error: updateError } = await supabase.from('media_assets').update(updates).eq('id', id).select(fields).single()
    if (updateError) return NextResponse.json({ error: 'Unable to update media asset.' }, { status: 500 })
    return NextResponse.json({ media: data })
  } catch (uploadError) {
    return NextResponse.json({ error: uploadError instanceof Error ? uploadError.message : 'Unable to upload image.' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const { supabase, error } = await getAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })
  const body = await request.json().catch(() => null) as { id?: string } | null
  if (!body?.id) return NextResponse.json({ error: 'A media asset is required.' }, { status: 400 })
  const { error: deleteError } = await supabase.from('media_assets').delete().eq('id', body.id)
  if (deleteError) return NextResponse.json({ error: 'Unable to delete media asset.' }, { status: 500 })
  return NextResponse.json({ deleted: true })
}

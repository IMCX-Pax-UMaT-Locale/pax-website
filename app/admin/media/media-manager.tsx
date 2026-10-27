'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, ImagePlus, Pencil, Trash2, X } from 'lucide-react'

type Media = { id: string; title: string; image_url: string; alt_text: string; sort_order: number; is_published: boolean; created_at: string; updated_at: string }

function emptyMedia() { return { id: '', title: '', image_url: '', alt_text: '', sort_order: 0, is_published: false } }

export default function MediaManager() {
  const [media, setMedia] = useState<Media[]>([])
  const [editing, setEditing] = useState<Media | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const loadMedia = useCallback(async () => {
    setLoading(true)
    const response = await fetch('/api/admin/media')
    const result = await response.json() as { media?: Media[]; error?: string }
    if (!response.ok) setError(result.error || 'Unable to load media.')
    else setMedia(result.media || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadMedia() }, [loadMedia])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/admin/media', { method: editing ? 'PATCH' : 'POST', body: form })
    const result = await response.json() as { error?: string }
    if (!response.ok) { setError(result.error || 'Unable to save media.'); return }
    setEditing(null); setCreating(false); setMessage(editing ? 'Media asset updated.' : 'Media asset added.')
    await loadMedia()
  }

  async function remove(item: Media) {
    if (!window.confirm(`Delete "${item.title}" from the carousel?`)) return
    const response = await fetch('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) })
    const result = await response.json() as { error?: string }
    if (!response.ok) { setError(result.error || 'Unable to delete media.'); return }
    setMessage('Media asset deleted.')
    await loadMedia()
  }

  async function move(item: Media, direction: -1 | 1) {
    const index = media.findIndex((asset) => asset.id === item.id)
    const target = media[index + direction]
    if (!target) return
    const updates = [
      { id: item.id, sort_order: target.sort_order },
      { id: target.id, sort_order: item.sort_order },
    ]
    await Promise.all(updates.map((update) => {
      const form = new FormData()
      form.set('id', update.id); form.set('title', media.find((asset) => asset.id === update.id)?.title || '')
      form.set('alt_text', media.find((asset) => asset.id === update.id)?.alt_text || '')
      form.set('image_url', media.find((asset) => asset.id === update.id)?.image_url || '')
      form.set('sort_order', update.sort_order.toString())
      form.set('is_published', (media.find((asset) => asset.id === update.id)?.is_published || false).toString())
      return fetch('/api/admin/media', { method: 'PATCH', body: form })
    }))
    await loadMedia()
  }

  const formAsset = editing || (creating ? emptyMedia() : null)
  return (
    <>
      <div className="media-toolbar"><span>{media.length} assets · {media.filter((item) => item.is_published).length} published</span><button className="button button-yellow" onClick={() => { setCreating(true); setEditing(null) }}><ImagePlus size={16} /> Add image</button></div>
      {message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}
      <div className="media-admin-grid">{loading ? <p className="auth-muted">Loading media…</p> : media.length === 0 ? <p className="auth-muted">No carousel images yet.</p> : media.map((item, index) => <article className="media-admin-card" key={item.id}><img src={item.image_url} alt={item.alt_text} /><div className="media-admin-copy"><span className={item.is_published ? 'member-active' : 'member-inactive'}>{item.is_published ? 'Published' : 'Unpublished'}</span><h2>{item.title}</h2><p>{item.alt_text}</p><small>Position {index + 1}</small></div><div className="media-actions"><button title="Move up" disabled={index === 0} onClick={() => move(item, -1)}><ChevronUp size={16} /></button><button title="Move down" disabled={index === media.length - 1} onClick={() => move(item, 1)}><ChevronDown size={16} /></button><button title="Edit image" onClick={() => { setEditing(item); setCreating(false) }}><Pencil size={16} /></button><button title="Delete image" onClick={() => remove(item)}><Trash2 size={16} /></button></div></article>)}</div>
      {formAsset && <div className="member-modal-backdrop"><section className="member-modal event-modal"><div className="panel-head"><div><p className="eyebrow">{editing ? 'Edit media' : 'Add media'}</p><h2>{editing ? editing.title : 'New carousel image'}</h2></div><button className="icon-button" aria-label="Close editor" onClick={() => { setEditing(null); setCreating(false) }}><X size={18} /></button></div><form onSubmit={save} encType="multipart/form-data">{editing && <input type="hidden" name="id" value={editing.id} />}<label>Title<input name="title" defaultValue={formAsset.title} required /></label><label>Alt text<input name="alt_text" defaultValue={formAsset.alt_text} required /></label><label>Image file<input name="image" type="file" accept="image/*" /></label><label>Or image URL<input name="image_url" type="url" defaultValue={formAsset.image_url} placeholder="https://…" /></label><div className="form-row"><label>Position<input name="sort_order" type="number" min="0" defaultValue={formAsset.sort_order} /></label><label>Visibility<select name="is_published" defaultValue={formAsset.is_published ? 'true' : 'false'}><option value="false">Unpublished</option><option value="true">Published</option></select></label></div><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => { setEditing(null); setCreating(false) }}>Cancel</button><button type="submit" className="button button-yellow">Save image</button></div></form></section></div>}
    </>
  )
}

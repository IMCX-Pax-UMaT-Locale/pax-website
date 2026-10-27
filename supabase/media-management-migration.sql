-- Run this once against an existing Supabase project.
grant insert, update, delete on public.media_assets to authenticated;

insert into storage.buckets (id, name, public)
values ('media-assets', 'media-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Admins manage media assets" on storage.objects;
create policy "Admins manage media assets"
on storage.objects for all
to authenticated
using (bucket_id = 'media-assets' and public.is_admin())
with check (bucket_id = 'media-assets' and public.is_admin());

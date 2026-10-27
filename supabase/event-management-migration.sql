-- Run this once against an existing Supabase project.
create index if not exists event_registrations_event_idx on public.event_registrations (event_id);

grant insert, update, delete on public.events to authenticated;
grant insert, update, delete on public.media_assets to authenticated;

drop policy if exists "Admins manage event registrations" on public.event_registrations;
create policy "Admins manage event registrations"
on public.event_registrations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('event-flyers', 'event-flyers', true)
on conflict (id) do update set public = true;

drop policy if exists "Admins manage event flyers" on storage.objects;
create policy "Admins manage event flyers"
on storage.objects for all
to authenticated
using (bucket_id = 'event-flyers' and public.is_admin())
with check (bucket_id = 'event-flyers' and public.is_admin());

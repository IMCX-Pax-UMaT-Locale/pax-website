-- Run this once against an existing Supabase project.
alter table public.profiles
  add column if not exists is_active boolean not null default true;

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
on public.profiles for delete
to authenticated
using (public.is_admin());

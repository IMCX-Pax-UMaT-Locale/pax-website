-- Run this once against an existing Supabase project.
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.site_settings enable row level security;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

drop policy if exists "Anyone can view public site settings" on public.site_settings;
create policy "Anyone can view public site settings"
on public.site_settings for select
to anon, authenticated
using (key in ('announcement_text', 'organization_name', 'contact_email', 'contact_phone', 'address', 'social_facebook', 'social_instagram'));

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

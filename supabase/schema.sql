-- IMCS-PAX Romana database schema
-- Run this in Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

create type public.profile_role as enum ('member', 'alumni', 'admin');
create type public.event_status as enum ('draft', 'published', 'cancelled');
create type public.registration_status as enum ('registered', 'attended', 'cancelled');
create type public.donation_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  contact_info text,
  hostel text,
  program text,
  graduation_year integer check (graduation_year between 1950 and 2100),
  role public.profile_role not null default 'member',
  is_active boolean not null default true,
  onboarding_complete boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text not null default 'Community',
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text not null,
  city text,
  flyer_url text,
  status public.event_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_end_after_start check (ends_at is null or ends_at >= starts_at)
);

create table public.event_registrations (
  event_id uuid not null references public.events (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  status public.registration_status not null default 'registered',
  registered_at timestamptz not null default timezone('utc', now()),
  attended_at timestamptz,
  primary key (event_id, member_id)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references public.profiles (id) on delete set null,
  amount bigint not null check (amount > 0),
  currency text not null default 'ghs' check (char_length(currency) = 3),
  status public.donation_status not null default 'pending',
  stripe_session_id text unique,
  hubtel_reference text unique,
  provider_response jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.site_settings (
  key text primary key,
  value text not null default '',
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

create type public.admin_invitation_status as enum ('pending', 'accepted', 'declined', 'expired');

create table public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  status public.admin_invitation_status not null default 'pending',
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days',
  responded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint admin_invitation_member_email check (char_length(email) > 3)
);

create unique index admin_invitations_pending_member_idx
on public.admin_invitations (member_id)
where status = 'pending';
create index admin_invitations_expires_at_idx on public.admin_invitations (expires_at);

create index events_starts_at_idx on public.events (starts_at);
create index events_status_idx on public.events (status);
create index event_registrations_member_idx on public.event_registrations (member_id);
create index event_registrations_event_idx on public.event_registrations (event_id);
create index donations_created_at_idx on public.donations (created_at);
create index donations_status_idx on public.donations (status);
create index donations_currency_idx on public.donations (currency);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger media_assets_set_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

create trigger donations_set_updated_at
before update on public.donations
for each row execute function public.set_updated_at();

create or replace function public.set_site_setting_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_site_setting_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, graduation_year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    case
      when (new.raw_user_meta_data ->> 'graduation_year') ~ '^[0-9]{4}$'
      then (new.raw_user_meta_data ->> 'graduation_year')::integer
      else null
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() = old.id and new.role is distinct from old.role then
    raise exception 'Only an administrator can change a profile role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_escalation();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.media_assets enable row level security;
alter table public.donations enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_invitations enable row level security;

create policy "Members can view their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "Members can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "Admins can delete profiles"
on public.profiles for delete
to authenticated
using (public.is_admin());

create policy "Anyone can view published events"
on public.events for select
to anon, authenticated
using (status = 'published' or public.is_admin());

create policy "Admins manage events"
on public.events for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Members view their registrations"
on public.event_registrations for select
to authenticated
using (member_id = auth.uid() or public.is_admin());

create policy "Members register themselves"
on public.event_registrations for insert
to authenticated
with check (member_id = auth.uid());

create policy "Members cancel their registrations"
on public.event_registrations for update
to authenticated
using (member_id = auth.uid() or public.is_admin())
with check (member_id = auth.uid() or public.is_admin());

create policy "Admins manage event registrations"
on public.event_registrations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Anyone can view published media"
on public.media_assets for select
to anon, authenticated
using (is_published = true or public.is_admin());

create policy "Admins manage media"
on public.media_assets for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Donors view their own donations"
on public.donations for select
to authenticated
using (donor_id = auth.uid() or public.is_admin());

create policy "Admins manage donations"
on public.donations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Anyone can view public site settings"
on public.site_settings for select
to anon, authenticated
using (key in ('announcement_text', 'organization_name', 'contact_email', 'contact_phone', 'address', 'social_facebook', 'social_instagram'));

create policy "Admins manage site settings"
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage admin invitations"
on public.admin_invitations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.events, public.media_assets to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.event_registrations to authenticated;
grant insert, update, delete on public.events to authenticated;
grant insert, update, delete on public.media_assets to authenticated;
grant select, update on public.donations to authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant select, insert, update on public.admin_invitations to authenticated;

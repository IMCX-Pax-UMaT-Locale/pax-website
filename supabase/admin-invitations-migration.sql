-- Run this once against an existing Supabase project.
do $$
begin
  create type public.admin_invitation_status as enum ('pending', 'accepted', 'declined', 'expired');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.admin_invitations (
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

create unique index if not exists admin_invitations_pending_member_idx
on public.admin_invitations (member_id)
where status = 'pending';
create index if not exists admin_invitations_expires_at_idx on public.admin_invitations (expires_at);

alter table public.admin_invitations enable row level security;
grant select, insert, update on public.admin_invitations to authenticated;

drop policy if exists "Admins manage admin invitations" on public.admin_invitations;
create policy "Admins manage admin invitations"
on public.admin_invitations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

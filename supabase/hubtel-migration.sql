-- Run this once if the donations table already exists.
alter table public.donations
  add column if not exists hubtel_reference text unique,
  add column if not exists provider_response jsonb;

-- Run this once against an existing Supabase project.
create index if not exists donations_currency_idx on public.donations (currency);
grant select, update on public.donations to authenticated;

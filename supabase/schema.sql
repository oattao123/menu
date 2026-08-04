-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- One row per collection; the app reads and writes whole collections as JSON.

create table if not exists public.store_state (
  key text primary key,
  data jsonb not null,
  client_id text,
  updated_at timestamptz not null default now()
);

alter table public.store_state enable row level security;

-- No login: anyone holding the public anon key (i.e. anyone with the site link)
-- may read and write. Replace these policies with auth-based ones if that changes.
drop policy if exists "anon read store_state" on public.store_state;
create policy "anon read store_state" on public.store_state
  for select using (true);

drop policy if exists "anon write store_state" on public.store_state;
create policy "anon write store_state" on public.store_state
  for all using (true) with check (true);

-- Needed so other devices receive changes live
alter publication supabase_realtime add table public.store_state;

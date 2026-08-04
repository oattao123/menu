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

-- ---------------------------------------------------------------------------
-- Safety net: keep the previous version of every row so an accidental
-- overwrite (two devices editing at once, a wrong bulk edit) can be restored.
-- ---------------------------------------------------------------------------

create table if not exists public.store_state_history (
  id bigserial primary key,
  key text not null,
  data jsonb not null,
  client_id text,
  saved_at timestamptz not null default now()
);

create index if not exists store_state_history_key_saved_at
  on public.store_state_history (key, saved_at desc);

create or replace function public.log_store_state_history()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.store_state_history (key, data, client_id, saved_at)
  values (old.key, old.data, old.client_id, old.updated_at);
  return new;
end;
$$;

drop trigger if exists store_state_history_trigger on public.store_state;
create trigger store_state_history_trigger
  before update on public.store_state
  for each row execute function public.log_store_state_history();

alter table public.store_state_history enable row level security;
-- History is recovery-only: readable, never writable from the browser.
drop policy if exists "anon read history" on public.store_state_history;
create policy "anon read history" on public.store_state_history
  for select using (true);

-- Keep the history from growing forever: drop entries older than 30 days.
-- (Run manually now and then, or schedule with pg_cron.)
-- delete from public.store_state_history where saved_at < now() - interval '30 days';

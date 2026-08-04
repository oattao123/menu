-- ===========================================================================
-- Real per-entity tables (replaces the single store_state JSON table).
-- Run once in the Supabase SQL editor. Safe to re-run.
-- ===========================================================================

create table if not exists public.products (
  id text primary key,
  sku text not null,
  name text not null,
  category text,
  price numeric not null default 0,
  wholesale_price numeric not null default 0,
  cost numeric not null default 0,
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  stock_matrix jsonb not null default '{}'::jsonb,
  svg_type text,
  image_url text,
  description text,
  needs_cost_review boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  timestamp text,
  date_str text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  item_discount numeric not null default 0,
  discount numeric not null default 0,
  vat_amount numeric not null default 0,
  grand_total numeric not null default 0,
  payment_method text,
  received_amount numeric,
  change_amount numeric,
  status text not null default 'Completed',
  customer jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_transactions (
  id text primary key,
  type text not null,
  amount numeric not null default 0,
  category text,
  payment_method text,
  date text,
  timestamp text,
  reference_id text,
  note text,
  is_auto boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id text primary key,
  name text not null,
  position text,
  daily_wage numeric not null default 0,
  start_date text,
  wage_logs jsonb not null default '[]'::jsonb,
  total_advance numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  name text primary key,
  sort_order int not null default 0
);

create table if not exists public.sizes (
  name text primary key,
  sort_order int not null default 0
);

-- Store settings are a single row
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Access: no login, same as before — anyone with the site link can read/write.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['products','orders','cash_transactions','employees','categories','sizes','settings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "anon all %s" on public.%I', t, t);
    execute format('create policy "anon all %s" on public.%I for all using (true) with check (true)', t, t);
    execute format('alter publication supabase_realtime add table public.%I', t);
  end loop;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Safety net: keep the previous version of every changed/deleted row.
-- ---------------------------------------------------------------------------
create table if not exists public.row_history (
  id bigserial primary key,
  table_name text not null,
  row_id text,
  data jsonb not null,
  action text not null,
  saved_at timestamptz not null default now()
);

create index if not exists row_history_lookup on public.row_history (table_name, saved_at desc);

create or replace function public.log_row_history()
returns trigger language plpgsql security definer as $$
begin
  insert into public.row_history (table_name, row_id, data, action)
  values (tg_table_name, coalesce(old.id::text, ''), to_jsonb(old), tg_op);
  return old;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['products','orders','cash_transactions','employees','settings']
  loop
    execute format('drop trigger if exists %I_history on public.%I', t, t);
    execute format(
      'create trigger %I_history before update or delete on public.%I
         for each row execute function public.log_row_history()', t, t);
  end loop;
end $$;

alter table public.row_history enable row level security;
drop policy if exists "anon read row_history" on public.row_history;
create policy "anon read row_history" on public.row_history for select using (true);

-- Housekeeping (run occasionally):
-- delete from public.row_history where saved_at < now() - interval '30 days';

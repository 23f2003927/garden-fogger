-- ============================================================
-- Garden Fogger — Supabase SQL Schema
-- Paste this into: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ── 1. devices ───────────────────────────────────────────────
create table if not exists devices (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  device_id  text not null unique,
  created_at timestamptz default now()
);

-- ── 2. sensor_logs ───────────────────────────────────────────
create table if not exists sensor_logs (
  id          uuid primary key default gen_random_uuid(),
  device_id   text not null references devices(device_id) on delete cascade,
  temperature numeric(5,2) not null,
  humidity    numeric(5,2) not null,
  created_at  timestamptz default now()
);

-- Fast "latest reading per device" queries
create index if not exists idx_sensor_logs_device_time
  on sensor_logs (device_id, created_at desc);

-- ── 3. settings ──────────────────────────────────────────────
create table if not exists settings (
  id                     uuid primary key default gen_random_uuid(),
  device_id              text not null unique references devices(device_id) on delete cascade,
  temp_threshold         numeric(5,2) not null default 35,
  humidity_threshold     numeric(5,2) not null default 40,
  fogger_manual_override boolean not null default false,
  fogger_status          boolean not null default false
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- devices
alter table devices enable row level security;

create policy "Authenticated users can read devices"
  on devices for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert devices"
  on devices for insert
  with check (auth.role() = 'authenticated');

-- sensor_logs
alter table sensor_logs enable row level security;

create policy "Authenticated users can read sensor_logs"
  on sensor_logs for select
  using (auth.role() = 'authenticated');

-- Note: ESP32 API routes use the service_role key, which bypasses RLS.

-- settings
alter table settings enable row level security;

create policy "Authenticated users can read settings"
  on settings for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert settings"
  on settings for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update settings"
  on settings for update
  using (auth.role() = 'authenticated');

-- ============================================================
-- Optional: auto-cleanup old logs (keep last 2000 per device)
-- Requires pg_cron extension — enable in Supabase > Database > Extensions
-- ============================================================
-- select cron.schedule(
--   'cleanup-sensor-logs',
--   '0 * * * *',
--   $$
--     delete from sensor_logs
--     where id not in (
--       select id from sensor_logs
--       order by created_at desc
--       limit 2000
--     )
--   $$
-- );

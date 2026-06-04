-- ============================================================
-- SmartFarm — Spectral Readings Table
-- Paste this into: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ── spectral_readings ───────────────────────────────────────
create table if not exists spectral_readings (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  node_id     text not null,

  -- Spectral channels (AS7341)
  violet_415  numeric(10,2),
  indigo_445  numeric(10,2),
  blue_480    numeric(10,2),
  cyan_515    numeric(10,2),
  green_555   numeric(10,2),
  yellow_590  numeric(10,2),
  orange_630  numeric(10,2),
  red_680     numeric(10,2),

  -- Extra channels
  clear_channel numeric(10,2),
  nir_channel   numeric(10,2),

  -- Environmental context
  temperature numeric(5,2),
  humidity    numeric(5,2),

  -- Raw JSON payload from ESP32
  raw_json    jsonb
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_spectral_readings_created_at
  on spectral_readings (created_at desc);

create index if not exists idx_spectral_readings_node_id
  on spectral_readings (node_id, created_at desc);

-- ── Row Level Security ──────────────────────────────────────
alter table spectral_readings enable row level security;

create policy "Authenticated users can read spectral_readings"
  on spectral_readings for select
  using (auth.role() = 'authenticated');

-- Note: ESP32 API routes use the service_role key, which bypasses RLS.

-- ── Enable Realtime ─────────────────────────────────────────
-- Run this to enable realtime on the table:
-- alter publication supabase_realtime add table spectral_readings;

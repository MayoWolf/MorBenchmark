create extension if not exists pgcrypto;

create table if not exists public.leaderboard_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  run_id text not null unique,
  display_name text not null default 'anonymous',
  team_number integer,
  model_provider text not null,
  model_name text not null,
  api_base_url text not null,
  benchmark_pack_id text not null,
  benchmark_pack_version text not null,
  benchmark_pack_hash text not null,
  total_score numeric not null,
  max_score numeric not null,
  percent_score numeric not null,
  task_count integer not null,
  signature_valid boolean not null default false,
  public_key_fingerprint text,
  signed_manifest jsonb not null,
  task_results jsonb not null,
  environment jsonb not null,
  submitted_from text not null default 'client'
);

create index if not exists leaderboard_runs_pack_idx
  on public.leaderboard_runs (benchmark_pack_id, benchmark_pack_version, percent_score desc);

create index if not exists leaderboard_runs_model_idx
  on public.leaderboard_runs (model_name, percent_score desc);

create index if not exists leaderboard_runs_created_at_idx
  on public.leaderboard_runs (created_at desc);

alter table public.leaderboard_runs enable row level security;

drop policy if exists "Public leaderboard read" on public.leaderboard_runs;
create policy "Public leaderboard read"
  on public.leaderboard_runs
  for select
  using (true);

drop policy if exists "Public leaderboard insert" on public.leaderboard_runs;
create policy "Public leaderboard insert"
  on public.leaderboard_runs
  for insert
  with check (
    length(display_name) between 1 and 80
    and (team_number is null or (team_number >= 1 and team_number <= 99999))
    and task_count > 0
    and max_score > 0
    and percent_score >= 0
    and percent_score <= 100
    and submitted_from = 'client'
  );

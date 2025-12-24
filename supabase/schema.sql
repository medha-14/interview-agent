-- Apply this in Supabase SQL Editor

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Interview sessions table
create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),

  company text not null,
  topic text not null,
  duration_minutes int not null,

  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  elapsed_seconds int not null default 0,

  agent_score numeric null,

  created_at timestamptz not null default now()
);

create index if not exists interview_sessions_user_created_idx
  on public.interview_sessions (user_id, created_at desc);

alter table public.interview_sessions enable row level security;

-- Users can read their own sessions
drop policy if exists "interview_sessions_select_own" on public.interview_sessions;
create policy "interview_sessions_select_own"
  on public.interview_sessions
  for select
  using (user_id = auth.uid());

-- Users can create their own sessions
drop policy if exists "interview_sessions_insert_own" on public.interview_sessions;
create policy "interview_sessions_insert_own"
  on public.interview_sessions
  for insert
  with check (user_id = auth.uid());

-- Users can update their own sessions
drop policy if exists "interview_sessions_update_own" on public.interview_sessions;
create policy "interview_sessions_update_own"
  on public.interview_sessions
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- (Optional) users can delete their own sessions
drop policy if exists "interview_sessions_delete_own" on public.interview_sessions;
create policy "interview_sessions_delete_own"
  on public.interview_sessions
  for delete
  using (user_id = auth.uid());

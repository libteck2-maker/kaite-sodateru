-- 「書いて育てる」製品版 v1 — Supabase スキーマ
-- Supabase ダッシュボードの SQL Editor で実行する

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  ink integer not null check (ink >= 0),
  created_at timestamptz not null default now()
);
create index if not exists entries_user_date_idx on public.entries (user_id, date);

alter table public.entries enable row level security;

create policy "own entries select" on public.entries
  for select using (auth.uid() = user_id);
create policy "own entries insert" on public.entries
  for insert with check (auth.uid() = user_id);
create policy "own entries delete" on public.entries
  for delete using (auth.uid() = user_id);

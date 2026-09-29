create table if not exists public.weekly_focuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  source_week_start date not null,
  source_week_end date not null,
  summary text not null default '',
  patterns jsonb not null default '[]'::jsonb,
  priorities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create index if not exists weekly_focuses_user_week_idx
  on public.weekly_focuses(user_id, week_start desc);

alter table public.weekly_focuses enable row level security;
grant select, insert, update, delete on public.weekly_focuses to authenticated;

create policy "weekly_focuses_select_own" on public.weekly_focuses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "weekly_focuses_insert_own" on public.weekly_focuses
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "weekly_focuses_update_own" on public.weekly_focuses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "weekly_focuses_delete_own" on public.weekly_focuses
  for delete to authenticated using ((select auth.uid()) = user_id);

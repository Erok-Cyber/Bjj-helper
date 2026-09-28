create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Athlete',
  belt text not null default 'White' check (belt in ('White','Blue','Purple','Brown','Black')),
  stripes int not null default 0 check (stripes between 0 and 4),
  gym text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.techniques (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  position text not null default '',
  gi_mode text not null default 'Both' check (gi_mode in ('Gi','No-Gi','Both')),
  notes text not null default '',
  video_url text not null default '',
  tags text[] not null default '{}',
  confidence int not null default 1 check (confidence between 1 and 5),
  drilling_count int not null default 0 check (drilling_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trained_at date not null default current_date,
  mode text not null check (mode in ('Gi','No-Gi')),
  duration_min int not null default 0 check (duration_min >= 0),
  rounds int not null default 0 check (rounds >= 0),
  submissions int not null default 0 check (submissions >= 0),
  taps int not null default 0 check (taps >= 0),
  rating int not null default 3 check (rating between 1 and 5),
  notes text not null default '',
  technique_ids uuid[] not null default '{}',
  partners text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists techniques_user_idx on public.techniques(user_id);
create index if not exists sessions_user_date_idx on public.sessions(user_id, trained_at desc);
create index if not exists flows_user_idx on public.flows(user_id);

alter table public.profiles enable row level security;
alter table public.techniques enable row level security;
alter table public.sessions enable row level security;
alter table public.flows enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.techniques to authenticated;
grant select, insert, update, delete on public.sessions to authenticated;
grant select, insert, update, delete on public.flows to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

create policy "techniques_select_own" on public.techniques for select to authenticated using ((select auth.uid()) = user_id);
create policy "techniques_insert_own" on public.techniques for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "techniques_update_own" on public.techniques for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "techniques_delete_own" on public.techniques for delete to authenticated using ((select auth.uid()) = user_id);

create policy "sessions_select_own" on public.sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "sessions_insert_own" on public.sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "sessions_update_own" on public.sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "sessions_delete_own" on public.sessions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "flows_select_own" on public.flows for select to authenticated using ((select auth.uid()) = user_id);
create policy "flows_insert_own" on public.flows for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "flows_update_own" on public.flows for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "flows_delete_own" on public.flows for delete to authenticated using ((select auth.uid()) = user_id);

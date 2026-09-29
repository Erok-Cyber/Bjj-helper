alter table public.flows
  add column if not exists tags text[] not null default '{}',
  add column if not exists refs jsonb not null default '[]'::jsonb;

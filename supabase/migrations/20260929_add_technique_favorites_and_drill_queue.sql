alter table public.techniques
  add column if not exists is_favorite boolean not null default false,
  add column if not exists in_drill_queue boolean not null default false;

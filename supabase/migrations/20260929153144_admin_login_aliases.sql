-- Login aliases are resolved only by the server, never exposed to browsers.
create table public.admin_login_aliases (
  username text primary key check (username = lower(username) and username ~ '^[a-z0-9_]{3,32}$'),
  user_id uuid not null unique references auth.users(id) on delete cascade
);
alter table public.admin_login_aliases enable row level security;
revoke all on table public.admin_login_aliases from public, anon, authenticated;
grant select on table public.admin_login_aliases to service_role;

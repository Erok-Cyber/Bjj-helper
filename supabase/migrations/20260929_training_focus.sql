alter table public.profiles
  add column if not exists weekly_session_goal int not null default 3 check (weekly_session_goal between 1 and 14),
  add column if not exists focus_position text not null default '',
  add column if not exists competition_date date,
  add column if not exists competition_weight text not null default '';

alter table public.sessions
  add column if not exists session_type text not null default 'Class + Sparring'
    check (session_type in ('Class + Sparring','Open Mat','Positional','Drilling')),
  add column if not exists positional_rounds int not null default 0 check (positional_rounds >= 0),
  add column if not exists focus_position text not null default '';

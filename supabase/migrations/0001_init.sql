-- Orbe: tablas en la nube (solo usuarios Plus). Los ids y las fechas los genera el cliente.

create table public.goals (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  direction text not null check (direction in ('up', 'down')),
  unit text not null,
  color text not null,
  icon text not null,
  start_value double precision not null,
  target_value double precision not null,
  deadline timestamptz,
  frequency text not null check (frequency in ('daily', 'weekly', 'free')),
  reminder_weekday smallint,
  reminder_hour smallint,
  reminder_minute smallint,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.entries (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  value double precision not null,
  note text,
  recorded_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

-- plus_until solo se escribe desde el backend (webhook de RevenueCat → Edge Function con service role).
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plus_until timestamptz
);

create index goals_user_updated_idx on public.goals (user_id, updated_at);
create index entries_user_updated_idx on public.entries (user_id, updated_at);
create index entries_goal_idx on public.entries (goal_id);

alter table public.goals enable row level security;
alter table public.entries enable row level security;
alter table public.profiles enable row level security;

create policy "goals_select_own" on public.goals for select to authenticated
  using (user_id = (select auth.uid()));
create policy "goals_insert_own" on public.goals for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "goals_update_own" on public.goals for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "goals_delete_own" on public.goals for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "entries_select_own" on public.entries for select to authenticated
  using (user_id = (select auth.uid()));
create policy "entries_insert_own" on public.entries for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "entries_update_own" on public.entries for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "entries_delete_own" on public.entries for delete to authenticated
  using (user_id = (select auth.uid()));

-- Sin políticas de escritura: el cliente solo puede leer su propio perfil.
create policy "profiles_select_own" on public.profiles for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.goals, public.entries, public.profiles from anon;
grant select, insert, update, delete on public.goals, public.entries to authenticated;
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;

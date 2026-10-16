-- TaskFlow database schema for Supabase (PostgreSQL).
-- Run once in Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- Entities:  auth.users 1 ──< projects 1 ──< tasks
-- Ownership is enforced HERE with Row Level Security, not in the app.
-- The app only ships the anon key; these policies are the real security boundary.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 1 and 60),
  description text check (description is null or char_length(description) <= 300),
  color       text not null default '#3F51B5' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       text not null check (char_length(trim(title)) between 1 and 120),
  notes       text check (notes is null or char_length(notes) <= 2000),
  status      text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority    text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_at      timestamptz,
  remind      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_due_at_idx on public.tasks (user_id, due_at);

-- ---------------------------------------------------------------------------
-- Keep updated_at current on every edit
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: a user can only ever see and change their own rows
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- Projects
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Tasks: the user must own the task AND the project it points at,
-- so nobody can attach a task to someone else's project.
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  );

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
  );

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- No policies are granted to the anon role, so signed-out requests see nothing.

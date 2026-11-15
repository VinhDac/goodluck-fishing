-- GOODLUCK FISHING: the three tables (PLAN.md, step 2; Vin, 15/11/2026: «đồng ý, tạo bảng đi»).
-- Run once in Supabase: SQL Editor, New query, paste all of this, Run. Running it again changes nothing.
-- Every table has row level security: the public key in the game's page can do only what the policies below allow.

-- 1. JOBS: the shared store. Anyone may read it (the jobs are public); only the harvester writes, with the secret key.
-- A job that closes is marked open = false, never deleted: a person's applied list keeps pointing at it.
create table if not exists public.jobs (
  id       text primary key,                 -- gh:company:123, lv:..., ab:...
  company  text not null,
  title    text not null,
  place    text not null default '',
  url      text not null,                    -- the company's own page, to apply
  posted   timestamptz,
  skills   jsonb not null default '{}'::jsonb,   -- {skill: times asked, three at most}, read by the harvester
  agency   boolean not null default false,
  open     boolean not null default true,
  seen_at  timestamptz not null default now()    -- the last harvest that found it open
);
create index if not exists jobs_open_posted on public.jobs (posted desc) where open;
alter table public.jobs enable row level security;
drop policy if exists "jobs are public to read" on public.jobs;
create policy "jobs are public to read" on public.jobs for select to anon, authenticated using (true);
grant select on public.jobs to anon, authenticated;
grant all on public.jobs to service_role;

-- 2. PROFILES: what each person looks for. Never the CV: it stays on the person's own device (PLAN.md 5).
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  titles      text[] not null default '{}',
  city        text not null default '',
  remote      boolean not null default true,
  show_agency boolean not null default false,
  updated_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- 3. CATCHES: each person's fishing box, the list that goes on from day to day.
create table if not exists public.catches (
  user_id   uuid not null references auth.users (id) on delete cascade,
  job_id    text not null references public.jobs (id),
  day       date not null default current_date,
  how       text not null check (how in ('caught', 'net')),
  status    text not null default 'new' check (status in ('new', 'applied', 'expired', 'not_for_me')),
  status_at timestamptz not null default now(),
  primary key (user_id, job_id)
);
create index if not exists catches_user_day on public.catches (user_id, day desc);
alter table public.catches enable row level security;
drop policy if exists "own catches" on public.catches;
create policy "own catches" on public.catches for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.catches to authenticated;
grant all on public.catches to service_role;

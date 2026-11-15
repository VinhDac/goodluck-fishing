-- GOODLUCK FISHING: fast search by words in a job's title and place (PLAN.md step 4, 15/11/2026).
-- The sky asks «a title with "engineer", a place with "london"» of 133,000 jobs; without these, the question ran past
-- the time Supabase gives a public page («canceling statement due to statement timeout»). Run once: SQL Editor, paste, Run.
create extension if not exists pg_trgm;
create index if not exists jobs_title_trgm on public.jobs using gin (title gin_trgm_ops) where open;
create index if not exists jobs_place_trgm on public.jobs using gin (place gin_trgm_ops) where open;
analyze public.jobs;

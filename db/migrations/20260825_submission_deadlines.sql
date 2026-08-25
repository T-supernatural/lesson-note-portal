-- Submission deadlines for academic note schedules.
-- Additive only: existing lesson notes are unchanged.

create table if not exists public.submission_deadlines (
  id uuid primary key default gen_random_uuid(),
  academic_session_id uuid not null references public.academic_sessions(id) on delete cascade,
  term text not null,
  week text not null,
  lesson_day text,
  due_at timestamp with time zone not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create unique index if not exists submission_deadlines_scope_idx
  on public.submission_deadlines (academic_session_id, term, week, coalesce(lesson_day, ''));

create index if not exists submission_deadlines_due_at_idx
  on public.submission_deadlines (due_at);

alter table public.submission_deadlines enable row level security;

drop policy if exists submission_deadlines_select_authenticated on public.submission_deadlines;
drop policy if exists submission_deadlines_insert_admin on public.submission_deadlines;
drop policy if exists submission_deadlines_update_admin on public.submission_deadlines;
drop policy if exists submission_deadlines_delete_admin on public.submission_deadlines;

create policy submission_deadlines_select_authenticated
  on public.submission_deadlines
  for select
  using (auth.uid() is not null);

create policy submission_deadlines_insert_admin
  on public.submission_deadlines
  for insert
  with check (is_admin(auth.uid()));

create policy submission_deadlines_update_admin
  on public.submission_deadlines
  for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy submission_deadlines_delete_admin
  on public.submission_deadlines
  for delete
  using (is_admin(auth.uid()));

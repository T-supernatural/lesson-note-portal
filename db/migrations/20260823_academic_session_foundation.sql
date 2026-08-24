-- Academic session foundation migration
-- Additive only: existing lesson notes are not changed or assigned to a session.

create table if not exists public.academic_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_on date,
  ends_on date,
  is_active boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint academic_sessions_date_order check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

insert into public.academic_sessions (name, starts_on, ends_on, is_active)
values
  ('2025/26', null, null, false),
  ('2026/27', null, null, true)
on conflict (name) do nothing;

alter table public.academic_sessions enable row level security;

alter table public.lesson_notes
  add column if not exists academic_session_id uuid references public.academic_sessions(id),
  add column if not exists lesson_day text,
  add column if not exists lesson_date date;

create index if not exists lesson_notes_session_term_week_idx
  on public.lesson_notes (academic_session_id, term, week);

create index if not exists lesson_notes_teacher_session_idx
  on public.lesson_notes (teacher_id, academic_session_id);

create index if not exists lesson_notes_class_subject_idx
  on public.lesson_notes (class_level, subject);

create index if not exists lesson_notes_lesson_date_idx
  on public.lesson_notes (lesson_date);

drop policy if exists academic_sessions_select_authenticated on public.academic_sessions;
drop policy if exists academic_sessions_insert_admin on public.academic_sessions;
drop policy if exists academic_sessions_update_admin on public.academic_sessions;
drop policy if exists academic_sessions_delete_admin on public.academic_sessions;

create policy academic_sessions_select_authenticated
  on public.academic_sessions
  for select
  using (auth.uid() is not null);

create policy academic_sessions_insert_admin
  on public.academic_sessions
  for insert
  with check (is_admin(auth.uid()));

create policy academic_sessions_update_admin
  on public.academic_sessions
  for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy academic_sessions_delete_admin
  on public.academic_sessions
  for delete
  using (is_admin(auth.uid()));

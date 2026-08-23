-- Supabase SQL schema for RealJoy Schools lesson portal

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('teacher', 'admin')),
  subject text,
  created_at timestamp with time zone default now()
);

create table if not exists lesson_notes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references profiles(id) on delete cascade,
  subject text not null,
  class_level text not null,
  academic_session text not null default '2025/26',
  term text not null,
  week text not null,
  lesson_day text not null default 'Unspecified',
  topic text not null,
  objectives text not null,
  materials text not null,
  introduction text not null,
  main_content text not null,
  evaluation text not null,
  teachers_presentation text,
  assignment text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  admin_comment text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  submitted_at timestamp with time zone
);

alter table lesson_notes add column if not exists academic_session text;
alter table lesson_notes add column if not exists lesson_day text;
update lesson_notes set academic_session = '2025/26' where academic_session is null;
update lesson_notes set lesson_day = 'Unspecified' where lesson_day is null;
alter table lesson_notes alter column academic_session set default '2025/26';
alter table lesson_notes alter column academic_session set not null;
alter table lesson_notes alter column lesson_day set default 'Unspecified';
alter table lesson_notes alter column lesson_day set not null;

create or replace function is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = user_id and role = 'admin');
$$;

alter table profiles enable row level security;
alter table lesson_notes enable row level security;

-- profiles policies
drop policy if exists profiles_select on profiles;
drop policy if exists profiles_insert_self on profiles;
drop policy if exists profiles_update_self on profiles;

create policy profiles_select on profiles
  for select
  using (auth.uid() = id OR is_admin(auth.uid()));

create policy profiles_insert_self on profiles
  for insert
  with check (auth.uid() = id);

create policy profiles_update_self on profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- lesson_notes policies
drop policy if exists lesson_notes_select_teacher on lesson_notes;
drop policy if exists lesson_notes_select_admin on lesson_notes;
drop policy if exists lesson_notes_insert_teacher on lesson_notes;
drop policy if exists lesson_notes_update_teacher on lesson_notes;
drop policy if exists lesson_notes_update_admin on lesson_notes;
drop policy if exists lesson_notes_delete_teacher on lesson_notes;
drop policy if exists lesson_notes_delete_admin on lesson_notes;

create policy lesson_notes_select_teacher on lesson_notes
  for select
  using (teacher_id = auth.uid());

create policy lesson_notes_select_admin on lesson_notes
  for select
  using (is_admin(auth.uid()));

create policy lesson_notes_insert_teacher on lesson_notes
  for insert
  with check (teacher_id = auth.uid());

create policy lesson_notes_update_teacher on lesson_notes
  for update
  using (teacher_id = auth.uid() AND status in ('draft', 'rejected'))
  with check (teacher_id = auth.uid() AND status in ('draft', 'rejected', 'submitted'));

create policy lesson_notes_update_admin on lesson_notes
  for update
  using (is_admin(auth.uid()));

create policy lesson_notes_delete_teacher on lesson_notes
  for delete
  using (teacher_id = auth.uid() AND status = 'draft');

create policy lesson_notes_delete_admin on lesson_notes
  for delete
  using (is_admin(auth.uid()));

-- Supabase Storage bucket used by the rich-text editor.
insert into storage.buckets (id, name, public)
values ('lesson-content', 'lesson-content', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists lesson_content_public_read on storage.objects;
drop policy if exists lesson_content_authenticated_upload on storage.objects;

create policy lesson_content_public_read on storage.objects
  for select
  using (bucket_id = 'lesson-content');

create policy lesson_content_authenticated_upload on storage.objects
  for insert
  with check (
    bucket_id = 'lesson-content'
    and auth.role() = 'authenticated'
  );
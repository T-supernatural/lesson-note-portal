-- Supabase SQL schema for RealJoy Schools lesson portal

create extension if not exists "pgcrypto";

create or replace function is_admin(user_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (select 1 from profiles where id = user_id and role = 'admin');
$$;

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
  term text not null,
  week text not null,
  topic text not null,
  objectives text not null,
  materials text not null,
  introduction text not null,
  main_content text not null,
  evaluation text not null,
  assignment text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  admin_comment text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  submitted_at timestamp with time zone
);

alter table profiles enable row level security;
alter table lesson_notes enable row level security;

-- profiles policies
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
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid() and status in ('draft', 'rejected'));

create policy lesson_notes_update_admin on lesson_notes
  for update
  using (is_admin(auth.uid()));
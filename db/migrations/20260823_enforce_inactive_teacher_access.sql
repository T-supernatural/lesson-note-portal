-- Enforce inactive teacher access at the database boundary.
-- Existing notes and profiles are not deleted or modified.

create or replace function public.is_active_teacher(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id
      and role = 'teacher'
      and is_active = true
  );
$$;

revoke execute on function public.is_active_teacher(uuid) from public, anon;
grant execute on function public.is_active_teacher(uuid) to authenticated;

drop policy if exists profiles_update_self on public.profiles;

drop policy if exists lesson_notes_select_teacher on public.lesson_notes;
drop policy if exists lesson_notes_insert_teacher on public.lesson_notes;
drop policy if exists lesson_notes_update_teacher on public.lesson_notes;
drop policy if exists lesson_notes_delete_teacher on public.lesson_notes;

create policy lesson_notes_select_teacher
  on public.lesson_notes
  for select
  using (teacher_id = auth.uid() and is_active_teacher(auth.uid()));

create policy lesson_notes_insert_teacher
  on public.lesson_notes
  for insert
  with check (teacher_id = auth.uid() and is_active_teacher(auth.uid()));

create policy lesson_notes_update_teacher
  on public.lesson_notes
  for update
  using (teacher_id = auth.uid() and is_active_teacher(auth.uid()) and status in ('draft', 'rejected'))
  with check (teacher_id = auth.uid() and is_active_teacher(auth.uid()) and status in ('draft', 'rejected', 'submitted'));

create policy lesson_notes_delete_teacher
  on public.lesson_notes
  for delete
  using (teacher_id = auth.uid() and is_active_teacher(auth.uid()) and status = 'draft');

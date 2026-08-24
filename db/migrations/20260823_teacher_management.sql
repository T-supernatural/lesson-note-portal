-- Teacher management migration
-- Additive only: existing profiles remain active and unchanged.

alter table public.profiles
  add column if not exists is_active boolean not null default true;

create index if not exists profiles_teacher_active_name_idx
  on public.profiles (role, is_active, full_name);

drop policy if exists profiles_update_admin on public.profiles;

create policy profiles_update_admin
  on public.profiles
  for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

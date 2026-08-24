-- Review history and in-app notification migration
-- Additive only: existing lesson notes and approval states are unchanged.

create table if not exists public.lesson_note_reviews (
  id uuid primary key default gen_random_uuid(),
  lesson_note_id uuid not null references public.lesson_notes(id) on delete cascade,
  admin_id uuid not null references public.profiles(id) on delete restrict,
  status text not null check (status in ('approved', 'rejected')),
  comment text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_note_id uuid references public.lesson_notes(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create index if not exists lesson_note_reviews_note_created_idx
  on public.lesson_note_reviews (lesson_note_id, created_at desc);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.lesson_note_reviews enable row level security;
alter table public.notifications enable row level security;

drop policy if exists lesson_note_reviews_select_teacher on public.lesson_note_reviews;
drop policy if exists lesson_note_reviews_select_admin on public.lesson_note_reviews;
drop policy if exists lesson_note_reviews_insert_admin on public.lesson_note_reviews;

create policy lesson_note_reviews_select_teacher
  on public.lesson_note_reviews
  for select
  using (exists (
    select 1 from public.lesson_notes
    where lesson_notes.id = lesson_note_reviews.lesson_note_id
      and lesson_notes.teacher_id = auth.uid()
  ));

create policy lesson_note_reviews_select_admin
  on public.lesson_note_reviews
  for select
  using (is_admin(auth.uid()));

create policy lesson_note_reviews_insert_admin
  on public.lesson_note_reviews
  for insert
  with check (is_admin(auth.uid()) and admin_id = auth.uid());

drop policy if exists notifications_select_self on public.notifications;
drop policy if exists notifications_update_self on public.notifications;
drop policy if exists notifications_insert_admin on public.notifications;

create policy notifications_select_self
  on public.notifications
  for select
  using (user_id = auth.uid());

create policy notifications_update_self
  on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_insert_admin
  on public.notifications
  for insert
  with check (is_admin(auth.uid()));

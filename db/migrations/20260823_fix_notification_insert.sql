-- Fix notification creation for admin review actions.
-- The function validates the caller and inserts under its protected owner context.

create or replace function public.create_notification(
  p_user_id uuid,
  p_lesson_note_id uuid,
  p_title text,
  p_message text
)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  created_notification public.notifications;
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only administrators can create notifications'
      using errcode = '42501';
  end if;

  insert into public.notifications (user_id, lesson_note_id, title, message)
  values (p_user_id, p_lesson_note_id, p_title, p_message)
  returning * into created_notification;

  return created_notification;
end;
$$;

revoke execute on function public.create_notification(uuid, uuid, text, text) from public, anon;
grant execute on function public.create_notification(uuid, uuid, text, text) to authenticated;

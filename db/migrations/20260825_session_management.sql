-- Session management migration
-- Additive only: no lesson notes are deleted or reassigned.

create unique index if not exists academic_sessions_one_active_idx
  on public.academic_sessions (is_active)
  where is_active = true;

create or replace function public.set_active_academic_session(p_session_id uuid)
returns public.academic_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_session public.academic_sessions;
begin
  if not is_admin(auth.uid()) then
    raise exception 'Only administrators can change the active session'
      using errcode = '42501';
  end if;

  if not exists (select 1 from public.academic_sessions where id = p_session_id) then
    raise exception 'Academic session not found'
      using errcode = 'P0002';
  end if;

  update public.academic_sessions set is_active = false where is_active = true;
  update public.academic_sessions
    set is_active = true
    where id = p_session_id
    returning * into selected_session;

  return selected_session;
end;
$$;

revoke execute on function public.set_active_academic_session(uuid) from public, anon;
grant execute on function public.set_active_academic_session(uuid) to authenticated;

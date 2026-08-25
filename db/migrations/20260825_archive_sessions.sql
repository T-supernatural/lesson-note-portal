-- Archive old academic sessions.
-- Additive only: sessions and lesson notes are preserved.

alter table public.academic_sessions
  add column if not exists is_archived boolean not null default false;

create index if not exists academic_sessions_archived_active_idx
  on public.academic_sessions (is_archived, is_active);

create or replace function public.set_academic_session_archived(
  p_session_id uuid,
  p_archived boolean
)
returns public.academic_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_session public.academic_sessions;
begin
  if not is_admin(auth.uid()) then
    raise exception 'Only administrators can archive sessions'
      using errcode = '42501';
  end if;

  if p_archived and exists (
    select 1 from public.academic_sessions
    where id = p_session_id and is_active = true
  ) then
    raise exception 'The active session cannot be archived'
      using errcode = '23514';
  end if;

  update public.academic_sessions
    set is_archived = p_archived
    where id = p_session_id
    returning * into changed_session;

  if changed_session.id is null then
    raise exception 'Academic session not found'
      using errcode = 'P0002';
  end if;

  return changed_session;
end;
$$;

revoke execute on function public.set_academic_session_archived(uuid, boolean) from public, anon;
grant execute on function public.set_academic_session_archived(uuid, boolean) to authenticated;

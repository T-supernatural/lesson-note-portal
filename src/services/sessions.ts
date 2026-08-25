import { supabase } from '../lib/supabase';
import type { AcademicSession } from '../types';

export const fetchAcademicSessions = async () => {
  const { data, error } = await supabase
    .from('academic_sessions')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name', { ascending: false });
  if (error) throw error;
  return (data as AcademicSession[]) ?? [];
};

export const fetchSelectableAcademicSessions = async () => {
  const sessions = await fetchAcademicSessions();
  return sessions.filter((session) => !session.is_archived);
};

export const createAcademicSession = async (session: Pick<AcademicSession, 'name' | 'starts_on' | 'ends_on' | 'is_active'>) => {
  const { data, error } = await supabase.from('academic_sessions').insert(session).select().single();
  if (error) throw error;
  return data as AcademicSession;
};

export const updateAcademicSession = async (sessionId: string, updates: Pick<AcademicSession, 'name' | 'starts_on' | 'ends_on'>) => {
  const { data, error } = await supabase.from('academic_sessions').update(updates).eq('id', sessionId).select().single();
  if (error) throw error;
  return data as AcademicSession;
};

export const setActiveAcademicSession = async (sessionId: string) => {
  const { data, error } = await supabase.rpc('set_active_academic_session', { p_session_id: sessionId });
  if (error) throw error;
  return data as AcademicSession;
};

export const setAcademicSessionArchived = async (sessionId: string, archived: boolean) => {
  const { data, error } = await supabase.rpc('set_academic_session_archived', {
    p_session_id: sessionId,
    p_archived: archived,
  });
  if (error) throw error;
  return data as AcademicSession;
};

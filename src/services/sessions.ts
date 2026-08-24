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

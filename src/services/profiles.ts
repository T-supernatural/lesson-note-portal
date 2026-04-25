import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export const fetchTeachers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('full_name', { ascending: true });
  if (error) throw error;
  return (data as Profile[]) ?? [];
};

export const fetchProfileCounts = async () => {
  const { data, error } = await supabase.rpc('count_profiles');
  if (error) throw error;
  return data;
};

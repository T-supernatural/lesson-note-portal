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

export const fetchActiveTeachers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .eq('is_active', true)
    .order('full_name', { ascending: true });
  if (error) throw error;
  return (data as Profile[]) ?? [];
};

export const updateTeacherProfile = async (teacherId: string, updates: Pick<Profile, 'full_name' | 'email' | 'subject' | 'is_active'>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', teacherId)
    .eq('role', 'teacher')
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
};

export const fetchProfileCounts = async () => {
  const { data, error } = await supabase.rpc('count_profiles');
  if (error) throw error;
  return data;
};

export type TeacherInvite = {
  email: string;
  full_name?: string;
  subject?: string;
};

export const inviteTeachers = async (teachers: TeacherInvite[]) => {
  const { data, error } = await supabase.functions.invoke('bulk-invite', {
    body: {
      teachers,
      redirectTo: `${window.location.origin}/reset-password`,
    },
  });
  if (error) throw error;
  return data as { invited: string[]; failed: Array<{ email: string; error: string }> };
};

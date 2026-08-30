import { supabase } from '../lib/supabase';
import type { SubmissionDeadline } from '../types';

export const fetchSubmissionDeadlines = async () => {
  const { data, error } = await supabase
    .from('submission_deadlines')
    .select('*')
    .order('due_at', { ascending: true });
  if (error) throw error;
  return (data as SubmissionDeadline[]) ?? [];
};

export const fetchActiveSubmissionDeadlines = async () => {
  const deadlines = await fetchSubmissionDeadlines();
  return deadlines.filter((deadline) => deadline.is_active);
};

export const createSubmissionDeadline = async (deadline: Omit<SubmissionDeadline, 'id' | 'created_at'>) => {
  let query = supabase
    .from('submission_deadlines')
    .select('id')
    .eq('academic_session_id', deadline.academic_session_id)
    .eq('term', deadline.term)
    .eq('week', deadline.week);
  query = deadline.lesson_day ? query.eq('lesson_day', deadline.lesson_day) : query.is('lesson_day', null);
  const { data: existing, error: lookupError } = await query.maybeSingle();
  if (lookupError) throw lookupError;

  if (existing?.id) return updateSubmissionDeadline(existing.id, { due_at: deadline.due_at, is_active: deadline.is_active });

  const { data, error } = await supabase.from('submission_deadlines').insert(deadline).select().single();
  if (error) throw error;
  return data as SubmissionDeadline;
};

export const updateSubmissionDeadline = async (deadlineId: string, updates: Pick<SubmissionDeadline, 'due_at' | 'is_active'>) => {
  const { data, error } = await supabase.from('submission_deadlines').update(updates).eq('id', deadlineId).select().single();
  if (error) throw error;
  return data as SubmissionDeadline;
};

export const deleteSubmissionDeadline = async (deadlineId: string) => {
  const { error } = await supabase
    .from('submission_deadlines')
    .delete()
    .eq('id', deadlineId);
  if (error) throw error;
};
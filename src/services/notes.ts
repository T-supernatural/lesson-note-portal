import { supabase } from '../lib/supabase';
import type { LessonNote } from '../types';

export const fetchTeacherNotes = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as LessonNote[]) ?? [];
};

export const fetchNoteById = async (noteId: string, teacherId?: string) => {
  let query = supabase.from('lesson_notes').select('*').eq('id', noteId);
  if (teacherId) query = query.eq('teacher_id', teacherId);
  const { data, error } = await query.single();
  if (error) throw error;
  return data as LessonNote;
};

export const createLessonNote = async (payload: Omit<LessonNote, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.from('lesson_notes').insert(payload).select().single();
  if (error) throw error;
  return data as LessonNote;
};

export const updateLessonNote = async (noteId: string, payload: Partial<LessonNote>) => {
  const { data, error } = await supabase
    .from('lesson_notes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .select()
    .single();
  if (error) throw error;
  return data as LessonNote;
};

export const deleteLessonNote = async (noteId: string) => {
  const { data, error } = await supabase
    .from('lesson_notes')
    .delete()
    .eq('id', noteId)
    .select()
    .single();
  if (error) throw error;
  return data as LessonNote;
};

export const fetchAllNotes = async () => {
  const { data, error } = await supabase
    .from('lesson_notes')
    .select('*')
    .neq('status', 'draft')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as LessonNote[]) ?? [];
};

export const fetchFilteredNotes = async (filters: {
  teacherId?: string;
  subject?: string;
  status?: string;
  week?: string;
}) => {
  let query = supabase.from('lesson_notes').select('*').order('updated_at', { ascending: false });
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);
  if (filters.subject) query = query.eq('subject', filters.subject);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.week) query = query.eq('week', filters.week);
  const { data, error } = await query;
  if (error) throw error;
  return (data as LessonNote[]) ?? [];
};

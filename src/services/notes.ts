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
  academicSessionId?: string;
  term?: string;
  teacherId?: string;
  classLevel?: string;
  subject?: string;
  status?: string;
  week?: string;
  lessonDay?: string;
  lessonDateFrom?: string;
  lessonDateTo?: string;
}) => {
  let query = supabase
    .from('lesson_notes')
    .select('*')
    .neq('status', 'draft')
    .order('updated_at', { ascending: false });
  if (filters.academicSessionId === 'unassigned') query = query.is('academic_session_id', null);
  else if (filters.academicSessionId) query = query.eq('academic_session_id', filters.academicSessionId);
  if (filters.term) query = query.eq('term', filters.term);
  if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);
  if (filters.classLevel) query = query.eq('class_level', filters.classLevel);
  if (filters.subject) query = query.eq('subject', filters.subject);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.week) query = query.eq('week', filters.week);
  if (filters.lessonDay === 'unspecified') query = query.is('lesson_day', null);
  else if (filters.lessonDay) query = query.eq('lesson_day', filters.lessonDay);
  if (filters.lessonDateFrom) query = query.gte('lesson_date', filters.lessonDateFrom);
  if (filters.lessonDateTo) query = query.lte('lesson_date', filters.lessonDateTo);
  const { data, error } = await query;
  if (error) throw error;
  return (data as LessonNote[]) ?? [];
};

export const fetchAnalyticsNotes = async (academicSessionId?: string) => {
  let query = supabase
    .from('lesson_notes')
    .select('status, subject, week, teacher_id, academic_session_id, updated_at');
  if (academicSessionId === 'unassigned') query = query.is('academic_session_id', null);
  else if (academicSessionId) query = query.eq('academic_session_id', academicSessionId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as Pick<LessonNote, 'status' | 'subject' | 'week' | 'teacher_id' | 'academic_session_id' | 'updated_at'>[]) ?? [];
};

import { supabase } from '../lib/supabase';
import type { LessonNoteReview } from '../types';

export const fetchNoteReviews = async (noteId: string) => {
  const { data, error } = await supabase
    .from('lesson_note_reviews')
    .select('*')
    .eq('lesson_note_id', noteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as LessonNoteReview[]) ?? [];
};

export const createNoteReview = async (review: Omit<LessonNoteReview, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('lesson_note_reviews').insert(review).select().single();
  if (error) throw error;
  return data as LessonNoteReview;
};
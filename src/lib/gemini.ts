import { supabase } from './supabase';

export type AiLessonGenerationRequest = {
  subject: string;
  classLevel: string;
  topic: string;
  week: string;
  term?: string;
  duration: string;
  learningLevel: 'Simple' | 'Moderate' | 'Advanced';
  curriculumStyle: string;
  additionalInstructions?: string;
  generationMode?: 'short' | 'detailed';
};

export type AiGeneratedLessonNote = {
  objectives: string;
  materials: string;
  introduction: string;
  teachers_presentation: string;
  main_content: string;
  evaluation: string;
  assignment: string;
};

export const stripHtmlTags = (value: string | null | undefined): string => {
  if (!value) return '';

  const text = String(value)
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/?(ul|ol)>/gi, '\n')
    .replace(/<\/?li>/gi, '\n• ')
    .replace(/<\/?(p|div|h[1-6])>/gi, '\n')
    .replace(/<\/?(strong|b|em|i|span)>/gi, '');

  const doc = new DOMParser().parseFromString(text, 'text/html');
  return (doc.body.textContent ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
};

export const generateLessonNote = async (
  params: AiLessonGenerationRequest,
): Promise<AiGeneratedLessonNote> => {
  const { data, error } = await supabase.functions.invoke<AiGeneratedLessonNote>(
    'generate-lesson-note',
    { body: params },
  );

  if (error) throw new Error(error.message || 'Unable to generate lesson note.');
  if (!data) throw new Error('The AI service returned an empty response.');
  return data;
};

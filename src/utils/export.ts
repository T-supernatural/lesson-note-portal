import type { LessonNote } from '../types';

const csvCell = (value: unknown) => {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export const downloadLessonNotesCsv = (notes: LessonNote[], sessionNames: Map<string, string>, teacherNames: Map<string, string>) => {
  const headers = ['Topic', 'Teacher', 'Subject', 'Class', 'Academic Session', 'Term', 'Week', 'Day', 'Lesson Date', 'Status', 'Created At', 'Updated At'];
  const rows = notes.map((note) => [
    note.topic,
    teacherNames.get(note.teacher_id) || 'Unknown teacher',
    note.subject,
    note.class_level,
    note.academic_session_id ? sessionNames.get(note.academic_session_id) || 'Unknown session' : 'Unassigned session',
    note.term,
    note.week,
    note.lesson_day || 'Unspecified',
    note.lesson_date || '',
    note.status,
    note.created_at,
    note.updated_at,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `lesson-notes-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export type UserRole = 'teacher' | 'admin';

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  subject: string | null;
  is_active: boolean;
  created_at: string;
};

export type LessonStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type LessonNoteReview = {
  id: string;
  lesson_note_id: string;
  admin_id: string;
  status: 'approved' | 'rejected';
  comment: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  lesson_note_id: string | null;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export type AcademicSession = {
  id: string;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
  created_at: string;
};

export type LessonNote = {
  id: string;
  teacher_id: string;
  academic_session_id?: string | null;
  subject: string;
  class_level: string;
  term: string;
  week: string;
  lesson_day?: string | null;
  lesson_date?: string | null;
  topic: string;
  objectives: string;
  materials: string;
  introduction: string;
  main_content: string;
  evaluation: string;
  teachers_presentation: string | null;
  assignment: string;
  status: LessonStatus;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

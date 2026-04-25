export type UserRole = 'teacher' | 'admin';

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  subject: string | null;
  created_at: string;
};

export type LessonStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type LessonNote = {
  id: string;
  teacher_id: string;
  subject: string;
  class_level: string;
  term: string;
  week: string;
  topic: string;
  objectives: string;
  materials: string;
  introduction: string;
  main_content: string;
  evaluation: string;
  assignment: string;
  status: LessonStatus;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createLessonNote, fetchNoteById, fetchTeacherNotes, updateLessonNote } from '../services/notes';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import PageHeader from '../components/PageHeader';

const classLevels = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Jss 1', 'Jss 2', 'Jss 3', 'Ss 1', 'Ss 2', 'Ss 3'];
const terms = ['Term 1', 'Term 2', 'Term 3'];
const weeks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const NoteFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [noteLocked, setNoteLocked] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [existingNote, setExistingNote] = useState<any>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({ mode: 'onTouched' });

  useEffect(() => {
    if (!profile) return;
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchNoteById(id)
      .then((note) => {
        if (note) {
          reset({
            subject: note.subject,
            class_level: note.class_level,
            term: note.term,
            week: note.week,
            topic: note.topic,
            objectives: note.objectives,
            materials: note.materials,
            introduction: note.introduction,
            main_content: note.main_content,
            evaluation: note.evaluation,
            assignment: note.assignment,
          });
          setExistingNote(note);
          setNoteLocked(note.status === 'submitted' || note.status === 'approved');
        }
      })
      .catch(() => toast.error('Unable to load note'))
      .finally(() => setLoading(false));
  }, [id, profile, reset]);

  const latestNote = async () => {
    if (!profile) return;
    setDuplicateLoading(true);
    try {
      const notes = await fetchTeacherNotes(profile.id);
      const last = notes.find((note) => note.id !== id && note.status !== 'draft');
      if (!last) {
        toast('No previous note found to duplicate', { icon: 'ℹ️' });
        return;
      }
      reset({
        subject: last.subject,
        class_level: last.class_level,
        term: last.term,
        week: last.week,
        topic: last.topic,
        objectives: last.objectives,
        materials: last.materials,
        introduction: last.introduction,
        main_content: last.main_content,
        evaluation: last.evaluation,
        assignment: last.assignment,
      });
    } finally {
      setDuplicateLoading(false);
    }
  };

  const onSubmit = async (data: Record<string, string>, status: 'draft' | 'submitted') => {
    if (!profile) return;
    if (noteLocked) {
      toast.error('This note is locked from editing.');
      return;
    }

    const payload = {
      teacher_id: profile.id,
      subject: data.subject,
      class_level: data.class_level,
      term: data.term,
      week: data.week,
      topic: data.topic,
      objectives: data.objectives,
      materials: data.materials,
      introduction: data.introduction,
      main_content: data.main_content,
      evaluation: data.evaluation,
      assignment: data.assignment,
      status,
      admin_comment: existingNote?.admin_comment ?? null,
      submitted_at: status === 'submitted' ? new Date().toISOString() : null,
    };

    try {
      if (id && existingNote) {
        await updateLessonNote(id, payload);
        toast.success(status === 'submitted' ? 'Lesson submitted' : 'Draft saved');
      } else {
        await createLessonNote(payload as any);
        toast.success(status === 'submitted' ? 'Lesson submitted' : 'Draft saved');
      }
      navigate('/notes');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to save note');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading note…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/notes')}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Lesson note form</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">{id ? 'Edit lesson note' : 'Create a new lesson note'}</h1>
            </div>
          </div>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <PageHeader title="Lesson note details" description="Complete all sections and save your work as a draft or submit for review." />
          {noteLocked ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              This lesson note has already been submitted or approved. You cannot edit it further unless it is rejected.
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit((data) => onSubmit(data, 'draft'))}>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
                <Input {...register('subject', { required: 'Subject is required' })} placeholder="Mathematics" disabled={noteLocked} />
                {errors.subject && <p className="mt-1 text-sm text-rose-600">{errors.subject.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Class level</label>
                <Select {...register('class_level', { required: 'Class level is required' })} disabled={noteLocked}>
                  <option value="">Select class</option>
                  {classLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </Select>
                {errors.class_level && <p className="mt-1 text-sm text-rose-600">{errors.class_level.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Term</label>
                <Select {...register('term', { required: 'Term is required' })} disabled={noteLocked}>
                  <option value="">Select term</option>
                  {terms.map((term) => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </Select>
                {errors.term && <p className="mt-1 text-sm text-rose-600">{errors.term.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Week</label>
                <Select {...register('week', { required: 'Week is required' })} disabled={noteLocked}>
                  <option value="">Select week</option>
                  {weeks.map((week) => (
                    <option key={week} value={week}>{week}</option>
                  ))}
                </Select>
                {errors.week && <p className="mt-1 text-sm text-rose-600">{errors.week.message}</p>}
              </div>
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Topic</label>
                <Input {...register('topic', { required: 'Topic is required' })} placeholder="Lesson topic" disabled={noteLocked} />
                {errors.topic && <p className="mt-1 text-sm text-rose-600">{errors.topic.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Learning objectives</label>
                <Textarea {...register('objectives', { required: 'Objectives are required' })} placeholder="Describe what students will learn" disabled={noteLocked} />
                {errors.objectives && <p className="mt-1 text-sm text-rose-600">{errors.objectives.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Teaching materials</label>
                <Textarea {...register('materials', { required: 'Materials are required' })} placeholder="List any resources or materials" disabled={noteLocked} />
                {errors.materials && <p className="mt-1 text-sm text-rose-600">{errors.materials.message}</p>}
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Introduction</label>
                <Textarea {...register('introduction', { required: 'Introduction is required' })} placeholder="Write a short introduction" disabled={noteLocked} />
                {errors.introduction && <p className="mt-1 text-sm text-rose-600">{errors.introduction.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Main lesson content</label>
                <Textarea {...register('main_content', { required: 'Main content is required' })} placeholder="Describe the teaching steps and activities" disabled={noteLocked} />
                {errors.main_content && <p className="mt-1 text-sm text-rose-600">{errors.main_content.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Evaluation</label>
                <Textarea {...register('evaluation', { required: 'Evaluation is required' })} placeholder="How will you assess learning?" disabled={noteLocked} />
                {errors.evaluation && <p className="mt-1 text-sm text-rose-600">{errors.evaluation.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Assignment</label>
                <Textarea {...register('assignment', { required: 'Assignment is required' })} placeholder="What tasks will learners complete?" disabled={noteLocked} />
                {errors.assignment && <p className="mt-1 text-sm text-rose-600">{errors.assignment.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="secondary" onClick={latestNote} disabled={duplicateLoading || noteLocked}>
                  {duplicateLoading ? 'Copying…' : 'Duplicate previous note'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/notes')}>
                  Cancel
                </Button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSubmitting || noteLocked}>
                  Save draft
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit((data) => onSubmit(data, 'submitted'))}
                  disabled={isSubmitting || noteLocked}
                >
                  Submit note
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NoteFormPage;

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fetchNoteById, updateLessonNote } from '../services/notes';
import { fetchAcademicSessions } from '../services/sessions';
import { createNoteReview, fetchNoteReviews } from '../services/reviews';
import { createNotification } from '../services/notifications';
import type { LessonNoteReview } from '../types';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import RichTextDisplay from '../components/RichTextDisplay';
import { formatDate } from '../utils/format';

const AdminReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [note, setNote] = useState<any>(null);
  const [teacherName, setTeacherName] = useState('Teacher');
  const [sessionName, setSessionName] = useState('Unassigned');
  const [reviews, setReviews] = useState<LessonNoteReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit } = useForm({ defaultValues: { admin_comment: '' } });

  useEffect(() => {
    if (!id || !profile) return;
    setLoading(true);
    fetchNoteById(id)
      .then(async (data) => {
        setNote(data);
        setReviewsLoading(true);
        fetchNoteReviews(data.id)
          .then(setReviews)
          .catch(() => setReviewsError('Review history could not be loaded.'))
          .finally(() => setReviewsLoading(false));
        if (data.academic_session_id) {
          fetchAcademicSessions().then((sessions) => {
            setSessionName(sessions.find((session) => session.id === data.academic_session_id)?.name || 'Unassigned');
          });
        }
        if (data?.teacher_id) {
          const { data: teacherData } = await supabase.from('profiles').select('full_name').eq('id', data.teacher_id).single();
          setTeacherName(teacherData?.full_name ?? 'Teacher');
        }
      })
      .catch(() => toast.error('Unable to load lesson note'))
      .finally(() => setLoading(false));
  }, [id, profile]);

  const submitReview = async (status: 'approved' | 'rejected', values: { admin_comment: string }) => {
    if (!note) return;
    try {
      await updateLessonNote(note.id, {
        status,
        admin_comment: values.admin_comment,
        updated_at: new Date().toISOString(),
      });
      const review = await createNoteReview({
        lesson_note_id: note.id,
        admin_id: profile!.id,
        status,
        comment: values.admin_comment || null,
      });
      await createNotification({
        user_id: note.teacher_id,
        lesson_note_id: note.id,
        title: status === 'approved' ? 'Lesson note approved' : 'Changes requested on lesson note',
        message: values.admin_comment || (status === 'approved' ? 'Your lesson note has been approved.' : 'Please review and update your lesson note.'),
      });
      setReviews((current) => [review, ...current]);
      setNote((current: any) => current ? { ...current, status, admin_comment: values.admin_comment } : current);
      toast.success(status === 'approved' ? 'Note approved' : 'Note rejected');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to update note');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading review…</div>;
  }

  if (!note) {
    return <div className="min-h-screen flex items-center justify-center">Lesson note not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Review note</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Review lesson submission</h1>
            <p className="mt-2 text-sm text-slate-600">Approve, reject, or request changes with a comment.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/admin/notes')}>Back to notes</Button>
            <Button variant="secondary" onClick={signOut}>Sign Out</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
            <PageHeader title={note.topic} description={`Submitted by ${teacherName} • ${note.subject} • ${note.term} • Week ${note.week}`} />
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Academic session</p>
                  <p className="mt-2 text-sm text-slate-600">{sessionName}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Class level</p>
                  <p className="mt-2 text-sm text-slate-600">{note.class_level}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Lesson day</p>
                  <p className="mt-2 text-sm text-slate-600">{note.lesson_day || 'Unspecified'}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Submitted</p>
                  <p className="mt-2 text-sm text-slate-600">{formatDate(note.submitted_at)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <section>
                  <h2 className="text-sm font-semibold text-slate-900">Learning objectives</h2>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{note.objectives}</p>
                </section>
                <section>
                  <h2 className="text-sm font-semibold text-slate-900">Teaching materials</h2>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{note.materials}</p>
                </section>
                <section>
                  <h2 className="text-sm font-semibold text-slate-900">Introduction</h2>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{note.introduction}</p>
                </section>
                <section>
                  <h2 className="text-sm font-semibold text-slate-900">Teacher's presentation</h2>
                  <div className="mt-2">
                    <RichTextDisplay content={note.teachers_presentation} />
                  </div>
                </section>
                <section>
                  <h2 className="text-sm font-semibold text-slate-900">Main content</h2>
                  <div className="mt-2">
                    <RichTextDisplay content={note.main_content} />
                  </div>
                </section>
                <section>
                  <h2 className="text-sm font-semibold text-slate-900">Evaluation</h2>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{note.evaluation}</p>
                </section>
                <section>
                  <h2 className="text-sm font-semibold text-slate-900">Assignment</h2>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{note.assignment}</p>
                </section>
              </div>
            </div>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Review actions</h2>
              <StatusBadge status={note.status} />
            </div>
            {reviewsLoading ? <p className="mt-6 text-sm text-slate-500">Loading review history…</p> : null}
            {reviewsError ? <p className="mt-6 text-sm text-rose-700">{reviewsError}</p> : null}
            {!reviewsLoading && !reviewsError && reviews.length > 0 ? (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-900">Review history</h3>
                <div className="mt-3 space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide">
                        <span className={review.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'}>{review.status}</span>
                        <span className="text-slate-500">{new Date(review.created_at).toLocaleString()}</span>
                      </div>
                      {review.comment ? <p className="mt-2 text-sm text-slate-600">{review.comment}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <form className="mt-6 space-y-5" onSubmit={handleSubmit((data) => submitReview('rejected', data))}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Admin comment</label>
                <textarea
                  className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-sky-200"
                  {...register('admin_comment')}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="primary" onClick={handleSubmit((data) => submitReview('approved', data))}>
                  Approve
                </Button>
                <Button type="submit" variant="danger">Reject</Button>
                <Button type="button" variant="outline" onClick={handleSubmit((data) => submitReview('rejected', data))}>
                  Request changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewPage;

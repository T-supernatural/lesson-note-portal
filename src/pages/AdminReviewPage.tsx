import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fetchNoteById, updateLessonNote } from '../services/notes';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import { formatDate } from '../utils/format';

const AdminReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [note, setNote] = useState<any>(null);
  const [teacherName, setTeacherName] = useState('Teacher');
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit } = useForm({ defaultValues: { admin_comment: '' } });

  useEffect(() => {
    if (!id || !profile) return;
    setLoading(true);
    fetchNoteById(id)
      .then(async (data) => {
        setNote(data);
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
      toast.success(status === 'approved' ? 'Note approved' : 'Note rejected');
      navigate('/admin/notes');
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
            <PageHeader title={note.topic} description={`Submitted by ${teacherName} • ${note.subject} • Week ${note.week}`} />
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Class level</p>
                  <p className="mt-2 text-sm text-slate-600">{note.class_level}</p>
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
                  <h2 className="text-sm font-semibold text-slate-900">Main content</h2>
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{note.main_content}</p>
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

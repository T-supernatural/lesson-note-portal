import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { fetchFilteredNotes } from '../services/notes';
import { fetchActiveTeachers } from '../services/profiles';
import { fetchAcademicSessions } from '../services/sessions';
import { fetchSubmissionDeadlines } from '../services/deadlines';
import type { AcademicSession, LessonNote, Profile, SubmissionDeadline } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

type ReportFilters = {
  session: string;
  term: string;
  classLevel: string;
  subject: string;
  week: string;
  day: string;
};

const emptyFilters: ReportFilters = { session: '', term: '', classLevel: '', subject: '', week: '', day: '' };
const classLevels = ['Playgroup', 'Nursery 1', 'Nursery 2', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Jss 1', 'Jss 2', 'Jss 3', 'Ss 1', 'Ss 2', 'Ss 3'];
const terms = ['Term 1', 'Term 2', 'Term 3'];
const weeks = Array.from({ length: 11 }, (_, index) => String(index + 1));
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminMissingNotesPage = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [deadlines, setDeadlines] = useState<SubmissionDeadline[]>([]);
  const [reportFilters, setReportFilters] = useState<ReportFilters>(emptyFilters);
  const { register, handleSubmit, reset } = useForm<ReportFilters>({ defaultValues: emptyFilters });

  useEffect(() => {
    if (!profile) return;
    Promise.all([fetchActiveTeachers(), fetchAcademicSessions(), fetchSubmissionDeadlines()])
      .then(([teacherData, sessionData, deadlineData]) => { setTeachers(teacherData); setSessions(sessionData); setDeadlines(deadlineData); })
      .catch(() => toast.error('Unable to load report options'))
      .finally(() => setLoading(false));
  }, [profile]);

  const runReport = async (filters: ReportFilters) => {
    setReportLoading(true);
    setReportFilters(filters);
    try {
      const result = await fetchFilteredNotes({
        academicSessionId: filters.session || undefined,
        term: filters.term || undefined,
        classLevel: filters.classLevel || undefined,
        subject: filters.subject.trim() || undefined,
        week: filters.week || undefined,
        lessonDay: filters.day || undefined,
      });
      setNotes(result);
      setHasRun(true);
    } catch {
      toast.error('Unable to generate missing-notes report');
    } finally {
      setReportLoading(false);
    }
  };

  const missingTeachers = useMemo(() => {
    const submittedTeacherIds = new Set(notes.map((note) => note.teacher_id));
    return teachers.filter((teacher) => !submittedTeacherIds.has(teacher.id));
  }, [notes, teachers]);

  const selectedSession = sessions.find((session) => session.id === reportFilters.session)?.name || 'all sessions';
  const reportDeadline = deadlines.find((deadline) => (
    deadline.is_active
    &&
    deadline.academic_session_id === reportFilters.session
    && deadline.term === reportFilters.term
    && deadline.week === reportFilters.week
    && (!reportFilters.day || !deadline.lesson_day || deadline.lesson_day === reportFilters.day)
  ));
  const isOverdue = reportDeadline ? new Date(reportDeadline.due_at).getTime() < Date.now() : false;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm uppercase tracking-[0.28em] text-slate-500">Administration</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Missing notes report</h1><p className="mt-2 text-sm text-slate-600">Identify active teachers without a submitted, approved, or rejected note for a selected schedule.</p></div>
          <div className="flex flex-wrap gap-3"><Button onClick={() => navigate('/admin')}>Dashboard</Button><Button variant="secondary" onClick={signOut}>Sign Out</Button></div>
        </div>
        <form className="mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft" onSubmit={handleSubmit(runReport)}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Report scope</h2><p className="mt-1 text-sm text-slate-500">Choose the schedule teachers are expected to complete.</p></div><div className="flex gap-3"><Button type="button" variant="outline" onClick={() => { reset(emptyFilters); setNotes([]); setHasRun(false); }}>Clear</Button><Button type="submit" disabled={reportLoading || loading}>{reportLoading ? 'Generating…' : 'Generate report'}</Button></div></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Academic session<Select {...register('session')}><option value="">All sessions</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.name}{session.is_active ? ' (Active)' : ''}</option>)}</Select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Term<Select {...register('term')}><option value="">All terms</option>{terms.map((term) => <option key={term} value={term}>{term}</option>)}</Select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Class<Select {...register('classLevel')}><option value="">All classes</option>{classLevels.map((level) => <option key={level} value={level}>{level}</option>)}</Select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subject<Input {...register('subject')} placeholder="Any subject" /></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Week<Select {...register('week')}><option value="">All weeks</option>{weeks.map((week) => <option key={week} value={week}>Week {week}</option>)}</Select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Day<Select {...register('day')}><option value="">All days</option>{days.map((day) => <option key={day} value={day}>{day}</option>)}</Select></label>
          </div>
        </form>
        {loading ? <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-soft">Loading report options…</div> : !hasRun ? <EmptyState title="Report not generated" subtitle="Choose a session, term, week, or other scope and generate the report." /> : <>{reportDeadline ? <div className={`mb-4 rounded-2xl border p-4 text-sm ${isOverdue ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-sky-200 bg-sky-50 text-sky-900'}`}>{isOverdue ? 'This submission scope is overdue.' : 'Submission deadline'} Due {new Date(reportDeadline.due_at).toLocaleString()}.</div> : null}{missingTeachers.length === 0 ? <EmptyState title="All active teachers have submitted notes" subtitle={`No missing submissions found for ${selectedSession}.`} /> : <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-6"><PageHeader title={`${missingTeachers.length} missing submission${missingTeachers.length === 1 ? '' : 's'}`} description="These active teachers have no non-draft note matching the selected scope." /><div className="mt-4 grid gap-3">{missingTeachers.map((teacher) => <div key={teacher.id} className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{teacher.full_name}</p><p className="text-sm text-slate-600">{teacher.email} • {teacher.subject || 'No subject assigned'}</p></div><Button variant="secondary" onClick={() => navigate('/admin/teachers')}>Manage teacher</Button></div>)}</div></div>}</>}
      </div>
    </div>
  );
};

export default AdminMissingNotesPage;

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { fetchAnalyticsNotes } from '../services/notes';
import { fetchTeachers } from '../services/profiles';
import { fetchAcademicSessions } from '../services/sessions';
import type { AcademicSession, LessonNote, Profile } from '../types';
import Button from '../components/Button';
import Select from '../components/Select';
import StatsCard from '../components/StatsCard';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

type AnalyticsNote = Pick<LessonNote, 'status' | 'subject' | 'week' | 'teacher_id' | 'academic_session_id' | 'updated_at'>;

const countBy = (items: string[]) => items.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item]: (counts[item] || 0) + 1 }), {});

const BarList = ({ values, labels }: { values: Record<string, number>; labels?: Record<string, string> }) => {
  const max = Math.max(...Object.values(values), 1);
  return <div className="space-y-3">{Object.entries(values).map(([key, value]) => <div key={key}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate text-slate-600">{labels?.[key] || key}</span><span className="font-semibold text-slate-900">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500" style={{ width: `${(value / max) * 100}%` }} /></div></div>)}</div>;
};

const AdminAnalyticsPage = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<AnalyticsNote[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    Promise.all([fetchTeachers(), fetchAcademicSessions()])
      .then(([teacherData, sessionData]) => { setTeachers(teacherData); setSessions(sessionData); })
      .catch(() => toast.error('Unable to load analytics'))
      .finally(() => setLoading(false));
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setAnalyticsLoading(true);
    fetchAnalyticsNotes(sessionId || undefined).then(setNotes).catch(() => toast.error('Unable to refresh analytics')).finally(() => setAnalyticsLoading(false));
  }, [profile, sessionId]);

  const summary = useMemo(() => {
    const approved = notes.filter((note) => note.status === 'approved').length;
    const rejected = notes.filter((note) => note.status === 'rejected').length;
    return { total: notes.length, drafts: notes.filter((note) => note.status === 'draft').length, submitted: notes.filter((note) => note.status === 'submitted').length, approved, approvalRate: approved + rejected ? Math.round((approved / (approved + rejected)) * 100) : 0 };
  }, [notes]);
  const subjectCounts = useMemo(() => countBy(notes.map((note) => note.subject)), [notes]);
  const weekCounts = useMemo(() => countBy(notes.map((note) => `Week ${note.week}`)), [notes]);
  const teacherCounts = useMemo(() => countBy(notes.map((note) => note.teacher_id)), [notes]);
  const teacherLabels = useMemo(() => Object.fromEntries(teachers.map((teacher) => [teacher.id, teacher.full_name])), [teachers]);

  return <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm uppercase tracking-[0.28em] text-slate-500">Administration</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Lesson analytics</h1><p className="mt-2 text-sm text-slate-600">Track note volume, status, subjects, weeks, and teacher submissions.</p></div><div className="flex flex-wrap gap-3"><Button onClick={() => navigate('/admin')}>Dashboard</Button><Button variant="secondary" onClick={signOut}>Sign Out</Button></div></div>
    <div className="mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><label className="w-full max-w-sm text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Academic session<Select value={sessionId} onChange={(event) => setSessionId(event.target.value)}><option value="">All sessions</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.name}{session.is_active ? ' (Active)' : ''}</option>)}<option value="unassigned">Unassigned</option></Select></label><span className="text-sm text-slate-500">{sessionId ? 'Filtered session' : 'All stored lesson notes'}</span></div></div>
    {loading || analyticsLoading ? <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-soft">Loading analytics…</div> : notes.length === 0 ? <EmptyState title="No lesson data yet" subtitle="Create or submit lesson notes to see analytics." /> : <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><StatsCard label="Total notes" value={summary.total} /><StatsCard label="Drafts" value={summary.drafts} /><StatsCard label="Submitted" value={summary.submitted} /><StatsCard label="Approved" value={summary.approved} /><StatsCard label="Approval rate (%)" value={summary.approvalRate} /></div><div className="mt-8 grid gap-6 lg:grid-cols-3"><div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft"><PageHeader title="By subject" description="Notes grouped by subject." /><div className="mt-5"><BarList values={subjectCounts} /></div></div><div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft"><PageHeader title="By week" description="Note volume across teaching weeks." /><div className="mt-5"><BarList values={weekCounts} /></div></div><div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft"><PageHeader title="By teacher" description="All note statuses included." /><div className="mt-5"><BarList values={teacherCounts} labels={teacherLabels} /></div></div></div></>}
  </div></div>;
};

export default AdminAnalyticsPage;
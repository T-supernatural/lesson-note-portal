import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchFilteredNotes } from '../services/notes';
import { fetchTeachers } from '../services/profiles';
import { fetchAcademicSessions } from '../services/sessions';
import type { AcademicSession, LessonNote, Profile } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

type NoteFilters = {
  session: string;
  term: string;
  teacher: string;
  classLevel: string;
  subject: string;
  week: string;
  day: string;
  status: string;
  lessonDateFrom: string;
  lessonDateTo: string;
};

const emptyFilters: NoteFilters = {
  session: '', term: '', teacher: '', classLevel: '', subject: '', week: '', day: '', status: '', lessonDateFrom: '', lessonDateTo: '',
};

const classLevels = ['Playgroup', 'Nursery 1', 'Nursery 2', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Jss 1', 'Jss 2', 'Jss 3', 'Ss 1', 'Ss 2', 'Ss 3'];
const terms = ['Term 1', 'Term 2', 'Term 3'];
const weeks = Array.from({ length: 11 }, (_, index) => String(index + 1));
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const toQueryFilters = (filters: NoteFilters) => ({
  academicSessionId: filters.session || undefined,
  term: filters.term || undefined,
  teacherId: filters.teacher || undefined,
  classLevel: filters.classLevel || undefined,
  subject: filters.subject.trim() || undefined,
  week: filters.week || undefined,
  lessonDay: filters.day || undefined,
  status: filters.status || undefined,
  lessonDateFrom: filters.lessonDateFrom || undefined,
  lessonDateTo: filters.lessonDateTo || undefined,
});

const AdminNotesPage = () => {
  const { profile, signOut } = useAuth();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<NoteFilters>(emptyFilters);
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm<NoteFilters>({ defaultValues: emptyFilters });

  const loadNotes = async (filters: NoteFilters) => {
    setLoading(true);
    setError(null);
    try {
      setNotes(await fetchFilteredNotes(toQueryFilters(filters)));
    } catch {
      setError('Unable to load lesson notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([fetchFilteredNotes({}), fetchTeachers(), fetchAcademicSessions()])
      .then(([notesData, teachersData, sessionsData]) => {
        setNotes(notesData);
        setTeachers(teachersData);
        setSessions(sessionsData);
      })
      .catch(() => setError('Unable to load the lesson library. Please try again.'))
      .finally(() => setLoading(false));
  }, [profile]);

  const sessionNames = useMemo(() => new Map(sessions.map((session) => [session.id, session.name])), [sessions]);
  const groupedNotes = useMemo(() => notes.reduce<Record<string, LessonNote[]>>((groups, note) => {
    const session = note.academic_session_id ? sessionNames.get(note.academic_session_id) || 'Unknown session' : 'Unassigned session';
    const key = `${session}|${note.term}`;
    groups[key] = [...(groups[key] || []), note];
    return groups;
  }, {}), [notes, sessionNames]);
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;
  const teacherName = (teacherId: string) => teachers.find((teacher) => teacher.id === teacherId)?.full_name || 'Unknown teacher';
  const allFilterLabels: Array<{ key: keyof NoteFilters; label: string; value: string }> = [
    { key: 'session', label: 'Session', value: activeFilters.session ? sessionNames.get(activeFilters.session) || 'Unassigned' : '' },
    { key: 'term', label: 'Term', value: activeFilters.term },
    { key: 'teacher', label: 'Teacher', value: activeFilters.teacher ? teacherName(activeFilters.teacher) : '' },
    { key: 'classLevel', label: 'Class', value: activeFilters.classLevel },
    { key: 'subject', label: 'Subject', value: activeFilters.subject },
    { key: 'week', label: 'Week', value: activeFilters.week ? `Week ${activeFilters.week}` : '' },
    { key: 'day', label: 'Day', value: activeFilters.day },
    { key: 'status', label: 'Status', value: activeFilters.status },
    { key: 'lessonDateFrom', label: 'Date from', value: activeFilters.lessonDateFrom },
    { key: 'lessonDateTo', label: 'Date to', value: activeFilters.lessonDateTo },
  ];
  const activeFilterLabels = allFilterLabels.filter((filter) => filter.value);

  const applyFilters = (filters: NoteFilters) => {
    setActiveFilters(filters);
    void loadNotes(filters);
  };

  const clearFilters = () => {
    reset(emptyFilters);
    setActiveFilters(emptyFilters);
    void loadNotes(emptyFilters);
  };

  const removeFilter = (key: keyof NoteFilters) => {
    const nextFilters = { ...activeFilters, [key]: '' };
    reset(nextFilters);
    setActiveFilters(nextFilters);
    void loadNotes(nextFilters);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Admin review</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Lesson library</h1>
            <p className="mt-2 text-sm text-slate-600">Filter notes across sessions, terms, teachers, classes, and schedules.</p>
          </div>
          <div className="flex flex-wrap gap-3"><Button onClick={() => navigate('/admin')}>Dashboard</Button><Button variant="secondary" onClick={signOut}>Sign Out</Button></div>
        </div>

        <form className="mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft" onSubmit={handleSubmit(applyFilters)}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-semibold text-slate-900">Filter lesson notes</h2><p className="mt-1 text-sm text-slate-500">Choose one or more filters, then apply them together.</p></div>
            <div className="flex flex-wrap items-center gap-3"><span className="text-sm text-slate-500" aria-live="polite">{activeFilterCount} active</span><Button type="button" variant="outline" onClick={clearFilters} disabled={!activeFilterCount}>Clear all</Button><Button type="submit" disabled={loading}>Apply filters</Button></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Academic session<Select {...register('session')}><option value="">All sessions</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.name}{session.is_active ? ' (Active)' : ''}</option>)}<option value="unassigned">Unassigned</option></Select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Term<Select {...register('term')}><option value="">All terms</option>{terms.map((term) => <option key={term} value={term}>{term}</option>)}</Select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Teacher<Select {...register('teacher')}><option value="">All teachers</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</Select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Class<Select {...register('classLevel')}><option value="">All classes</option>{classLevels.map((level) => <option key={level} value={level}>{level}</option>)}</Select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subject<Input {...register('subject')} placeholder="Any subject" /></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Week<Select {...register('week')}><option value="">All weeks</option>{weeks.map((week) => <option key={week} value={week}>Week {week}</option>)}</Select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Day<Select {...register('day')}><option value="">All days</option>{days.map((day) => <option key={day} value={day}>{day}</option>)}</Select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status<Select {...register('status')}><option value="">All statuses</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lesson date from<Input type="date" {...register('lessonDateFrom')} /></label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lesson date to<Input type="date" {...register('lessonDateTo')} /></label>
          </div>
          {activeFilterLabels.length > 0 ? <div className="mt-5 flex flex-wrap gap-2" aria-label="Active filters">
            {activeFilterLabels.map((filter) => <button key={filter.key} type="button" onClick={() => removeFilter(filter.key)} className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-900 hover:bg-sky-100" aria-label={`Remove ${filter.label} filter`}>
              <span>{filter.label}: {filter.value}</span><X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>)}
          </div> : null}
        </form>

        {error ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error} <button className="ml-2 font-semibold underline" type="button" onClick={() => void loadNotes(activeFilters)}>Retry</button></div> : null}
        {!loading && !error ? <p className="mb-4 text-sm font-medium text-slate-600" aria-live="polite">Showing {notes.length} matching notes</p> : null}
        {loading ? <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-soft">Loading notes…</div> : !error && notes.length === 0 ? <EmptyState title="No notes match these filters" subtitle="Clear or adjust the filters to view more lesson notes." /> : !error ? (
          <div className="space-y-8">{Object.entries(groupedNotes).map(([groupKey, groupNotes]) => { const [session, term] = groupKey.split('|'); return <section key={groupKey}><div className="mb-3 flex items-baseline gap-3"><h2 className="text-xl font-semibold text-slate-900">{session}</h2><span className="text-sm font-medium text-slate-500">{term}</span></div><div className="grid gap-4">{groupNotes.map((note) => <div key={note.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h3 className="text-lg font-semibold text-slate-900">{note.topic}</h3><p className="mt-2 text-sm text-slate-600">{note.subject} • {note.class_level} • Week {note.week} • {note.lesson_day || 'Unspecified day'}</p><p className="mt-2 text-sm text-slate-500">{teacherName(note.teacher_id)}</p></div><div className="flex flex-wrap items-center gap-3"><StatusBadge status={note.status} /><Button variant="secondary" onClick={() => navigate(`/admin/notes/${note.id}`)}>Review</Button></div></div></div>)}</div></section>; })}</div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminNotesPage;

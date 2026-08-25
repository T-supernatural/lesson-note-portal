import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/auth-context';
import { fetchFilteredNotes, updateLessonNote } from '../services/notes';
import { fetchTeachers } from '../services/profiles';
import { fetchAcademicSessions } from '../services/sessions';
import { downloadLessonNotesCsv } from '../utils/export';
import { createNoteReview } from '../services/reviews';
import { createNotification } from '../services/notifications';
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
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
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

  const teacherNames = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher.full_name])), [teachers]);

  const assignSession = async (noteId: string, sessionId: string) => {
    if (!sessionId) return;
    setAssigningId(noteId);
    try {
      const updated = await updateLessonNote(noteId, { academic_session_id: sessionId });
      setNotes((current) => current.map((note) => note.id === noteId ? updated : note));
    } catch {
      setError('Unable to assign the academic session. Please try again.');
    } finally {
      setAssigningId(null);
    }
  };

  const selectableNotes = notes.filter((note) => note.status === 'submitted');
  const selectedNotes = notes.filter((note) => selectedIds.includes(note.id));
  const allSelectableSelected = selectableNotes.length > 0 && selectableNotes.every((note) => selectedIds.includes(note.id));

  const toggleSelection = (noteId: string) => {
    setSelectedIds((current) => current.includes(noteId) ? current.filter((id) => id !== noteId) : [...current, noteId]);
  };

  const toggleAllSelectable = () => {
    setSelectedIds(allSelectableSelected ? [] : selectableNotes.map((note) => note.id));
  };

  const bulkReview = async (status: 'approved' | 'rejected') => {
    const targets = selectedNotes.filter((note) => note.status === 'submitted');
    if (!targets.length || !profile) return;
    const comment = status === 'rejected' ? window.prompt('Enter the comment to send with this bulk rejection:') : '';
    if (status === 'rejected' && comment === null) return;
    setBulkLoading(true);
    try {
      for (const note of targets) {
        await updateLessonNote(note.id, { status, admin_comment: comment || null });
        await createNoteReview({ lesson_note_id: note.id, admin_id: profile.id, status, comment: comment || null });
        await createNotification({
          user_id: note.teacher_id,
          lesson_note_id: note.id,
          title: status === 'approved' ? 'Lesson note approved' : 'Changes requested on lesson note',
          message: comment || (status === 'approved' ? 'Your lesson note has been approved.' : 'Please review and update your lesson note.'),
        });
      }
      setNotes((current) => current.map((note) => selectedIds.includes(note.id) ? { ...note, status, admin_comment: comment || null } : note));
      setSelectedIds([]);
      toast.success(`${targets.length} note${targets.length === 1 ? '' : 's'} ${status === 'approved' ? 'approved' : 'returned for changes'}`);
    } catch (error: any) {
      toast.error(error?.message || 'Some bulk actions could not be completed');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="admin-notes-page min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Admin review</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Lesson library</h1>
            <p className="mt-2 text-sm text-slate-600">Filter notes across sessions, terms, teachers, classes, and schedules.</p>
          </div>
          <div className="no-print flex flex-wrap gap-3"><Button onClick={() => navigate('/admin')}>Dashboard</Button><Button variant="secondary" onClick={signOut}>Sign Out</Button></div>
        </div>

        <form className="no-print mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft" onSubmit={handleSubmit(applyFilters)}>
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
        {!loading && !error ? <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-3"><p className="text-sm font-medium text-slate-600" aria-live="polite">Showing {notes.length} matching notes</p><label className="inline-flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={allSelectableSelected} onChange={toggleAllSelectable} disabled={!selectableNotes.length || bulkLoading} /> Select submitted ({selectableNotes.length})</label></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => downloadLessonNotesCsv(notes, sessionNames, teacherNames)} disabled={notes.length === 0}>Export CSV</Button><Button type="button" variant="secondary" onClick={() => window.print()} disabled={notes.length === 0}>Export PDF</Button>{selectedNotes.length > 0 ? <Button type="button" variant="primary" onClick={() => void bulkReview('approved')} disabled={bulkLoading}>{bulkLoading ? 'Processing…' : `Approve selected (${selectedNotes.length})`}</Button> : null}{selectedNotes.length > 0 ? <Button type="button" variant="danger" onClick={() => void bulkReview('rejected')} disabled={bulkLoading}>Reject selected</Button> : null}{selectedNotes.length > 0 ? <Button type="button" variant="outline" onClick={() => downloadLessonNotesCsv(selectedNotes, sessionNames, teacherNames)} disabled={bulkLoading}>Export selected</Button> : null}</div></div> : null}
        {loading ? <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-soft">Loading notes…</div> : !error && notes.length === 0 ? <EmptyState title="No notes match these filters" subtitle="Clear or adjust the filters to view more lesson notes." /> : !error ? (
          <div className="space-y-8">{Object.entries(groupedNotes).map(([groupKey, groupNotes]) => { const [session, term] = groupKey.split('|'); return <section key={groupKey}><div className="mb-3 flex items-baseline gap-3"><h2 className="text-xl font-semibold text-slate-900">{session}</h2><span className="text-sm font-medium text-slate-500">{term}</span></div><div className="grid gap-4">{groupNotes.map((note) => <div key={note.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex gap-3"><div className="no-print pt-1">{note.status === 'submitted' ? <input type="checkbox" checked={selectedIds.includes(note.id)} onChange={() => toggleSelection(note.id)} aria-label={`Select ${note.topic}`} disabled={bulkLoading} /> : null}</div><div><h3 className="text-lg font-semibold text-slate-900">{note.topic}</h3><p className="mt-2 text-sm text-slate-600">{note.subject} • {note.class_level} • Week {note.week} • {note.lesson_day || 'Unspecified day'}</p><p className="mt-2 text-sm text-slate-500">{teacherName(note.teacher_id)}</p>{!note.academic_session_id ? <label className="no-print mt-3 block max-w-xs text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Assign session<Select value="" onChange={(event) => void assignSession(note.id, event.target.value)} disabled={assigningId === note.id || bulkLoading}><option value="">Choose session</option>{sessions.map((availableSession) => <option key={availableSession.id} value={availableSession.id}>{availableSession.name}</option>)}</Select></label> : null}</div></div><div className="no-print flex flex-wrap items-center gap-3"><StatusBadge status={note.status} /><Button variant="secondary" onClick={() => navigate(`/admin/notes/${note.id}`)} disabled={bulkLoading}>Review</Button></div></div></div>)}</div></section>; })}</div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminNotesPage;

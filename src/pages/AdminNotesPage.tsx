import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { fetchAllNotes } from '../services/notes';
import { fetchTeachers } from '../services/profiles';
import type { LessonNote, Profile } from '../types';
import Button from '../components/Button';
import Select from '../components/Select';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

type NoteFilters = {
  session: string;
  teacher: string;
  classLevel: string;
  subject: string;
  term: string;
  status: string;
  week: string;
  day: string;
};

const emptyFilters: NoteFilters = {
  session: '', teacher: '', classLevel: '', subject: '', term: '', status: '', week: '', day: '',
};

const AdminNotesPage = () => {
  const { profile, signOut } = useAuth();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { register, watch, reset } = useForm<NoteFilters>({ defaultValues: emptyFilters });
  const filters = watch();

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([fetchAllNotes(), fetchTeachers()])
      .then(([notesData, teachersData]) => {
        setNotes(notesData);
        setTeachers(teachersData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile]);

  const filteredNotes = useMemo(() => notes.filter((note) => {
    if (filters.session && (note.academic_session || '2025/26') !== filters.session) return false;
    if (filters.teacher && note.teacher_id !== filters.teacher) return false;
    if (filters.classLevel && note.class_level !== filters.classLevel) return false;
    if (filters.subject && note.subject !== filters.subject) return false;
    if (filters.term && note.term !== filters.term) return false;
    if (filters.status && note.status !== filters.status) return false;
    if (filters.week && note.week !== filters.week) return false;
    if (filters.day && (note.lesson_day || 'Unspecified') !== filters.day) return false;
    return true;
  }), [filters, notes]);

  const sessions = Array.from(new Set(notes.map((note) => note.academic_session || '2025/26'))).sort().reverse();
  const classLevels = Array.from(new Set(notes.map((note) => note.class_level))).filter(Boolean).sort();
  const subjects = Array.from(new Set(notes.map((note) => note.subject))).filter(Boolean).sort();
  const terms = Array.from(new Set(notes.map((note) => note.term))).filter(Boolean).sort();
  const weeks = Array.from(new Set(notes.map((note) => note.week))).filter(Boolean).sort((a, b) => Number(a) - Number(b));
  const days = Array.from(new Set(notes.map((note) => note.lesson_day || 'Unspecified'))).sort();

  const groupedNotes = filteredNotes.reduce<Record<string, LessonNote[]>>((groups, note) => {
    const key = `${note.academic_session || '2025/26'}|${note.term}`;
    groups[key] = [...(groups[key] || []), note];
    return groups;
  }, {});

  const teacherName = (teacherId: string) => teachers.find((teacher) => teacher.id === teacherId)?.full_name || 'Unknown teacher';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Admin review</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Lesson library</h1>
            <p className="mt-2 text-sm text-slate-600">Browse notes inside each academic session and term.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/admin')}>Dashboard</Button>
            <Button variant="secondary" onClick={signOut}>Sign Out</Button>
          </div>
        </div>

        <div className="mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filter lesson notes</h2>
              <p className="mt-1 text-sm text-slate-500">Combine any filters to narrow the results.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => reset(emptyFilters)}>Clear filters</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Session
              <Select {...register('session')}><option value="">All sessions</option>{sessions.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Term
              <Select {...register('term')}><option value="">All terms</option>{terms.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Teacher
              <Select {...register('teacher')}><option value="">All teachers</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</Select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Class
              <Select {...register('classLevel')}><option value="">All classes</option>{classLevels.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subject
              <Select {...register('subject')}><option value="">All subjects</option>{subjects.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Week
              <Select {...register('week')}><option value="">All weeks</option>{weeks.map((value) => <option key={value} value={value}>Week {value}</option>)}</Select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Day
              <Select {...register('day')}><option value="">All days</option>{days.map((value) => <option key={value} value={value}>{value}</option>)}</Select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status
              <Select {...register('status')}><option value="">All statuses</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Select>
            </label>
          </div>
        </div>

        <p className="mb-4 text-sm font-medium text-slate-600">Showing {filteredNotes.length} of {notes.length} notes</p>
        {loading ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-soft">Loading notes…</div>
        ) : filteredNotes.length === 0 ? (
          <EmptyState title="No notes match filters" subtitle="Try changing one or more filters." />
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedNotes).map(([groupKey, groupNotes]) => {
              const [session, term] = groupKey.split('|');
              return (
                <section key={groupKey}>
                  <div className="mb-3 flex items-baseline gap-3"><h2 className="text-xl font-semibold text-slate-900">{session}</h2><span className="text-sm font-medium text-slate-500">{term}</span></div>
                  <div className="grid gap-4">
                    {groupNotes.map((note) => (
                      <div key={note.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div><h3 className="text-lg font-semibold text-slate-900">{note.topic}</h3><p className="mt-2 text-sm text-slate-600">{note.subject} • {note.class_level} • Week {note.week} • {note.lesson_day}</p><p className="mt-2 text-sm text-slate-500">{teacherName(note.teacher_id)}</p></div>
                          <div className="flex flex-wrap items-center gap-3"><StatusBadge status={note.status} /><Button variant="secondary" onClick={() => navigate(`/admin/notes/${note.id}`)}>Review</Button></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotesPage;

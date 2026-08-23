import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAllNotes } from '../services/notes';
import { fetchTeachers } from '../services/profiles';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

const AdminNotesPage = () => {
  const { profile, signOut } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { register, watch } = useForm({ defaultValues: { teacher: '', subject: '', status: '', week: '' } });
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

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (filters.teacher && note.teacher_id !== filters.teacher) return false;
      if (filters.subject && note.subject !== filters.subject) return false;
      if (filters.status && note.status !== filters.status) return false;
      if (filters.week && note.week !== filters.week) return false;
      return true;
    });
  }, [notes, filters]);

  const subjects = Array.from(new Set(notes.map((note) => note.subject))).filter(Boolean);
  const weeks = Array.from(new Set(notes.map((note) => note.week))).filter(Boolean).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* <Button variant="outline" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button> */}
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Admin review</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">All lesson notes</h1>
              <p className="mt-2 text-sm text-slate-600">Filter notes using teacher, subject, status, or week.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/admin')}>Dashboard</Button>
            <Button variant="secondary" onClick={signOut}>Sign Out</Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Teacher</p>
            <Select {...register('teacher')}>
              <option value="">All teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
              ))}
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Subject</p>
            <Select {...register('subject')}>
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Status</p>
            <Select {...register('status')}>
              <option value="">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Week</p>
            <Select {...register('week')}>
              <option value="">All weeks</option>
              {weeks.map((week) => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-soft">Loading notes…</div>
        ) : filteredNotes.length === 0 ? (
          <EmptyState title="No notes match filters" subtitle="Try changing the teacher, subject, status, or week filters." />
        ) : (
          <div className="grid gap-4">
            {filteredNotes.map((note) => (
              <div key={note.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{note.topic}</h2>
                    <p className="mt-2 text-sm text-slate-600">{note.subject} • {note.class_level} • Week {note.week}</p>
                    <p className="mt-2 text-sm text-slate-500">Teacher ID: {note.teacher_id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={note.status} />
                    <Button variant="secondary" onClick={() => navigate(`/admin/notes/${note.id}`)}>Review</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotesPage;

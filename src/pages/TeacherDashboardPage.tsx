import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchTeacherNotes } from '../services/notes';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import EmptyState from '../components/EmptyState';

const TeacherDashboardPage = () => {
  const { profile, signOut } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    fetchTeacherNotes(profile.id)
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile]);

  const stats = useMemo(() => {
    const count = (status: string) => notes.filter((note) => note.status === status).length;
    return {
      draft: count('draft'),
      submitted: count('submitted'),
      approved: count('approved'),
      rejected: count('rejected'),
    };
  }, [notes]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Teacher workspace</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back, {profile?.full_name}</h1>
            <p className="mt-2 text-sm text-slate-600">Prepare lesson notes, save drafts, and submit weekly for review.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/notes/new')}>
              <Plus className="h-4 w-4" />
              New Note
            </Button>
            <Button variant="outline" onClick={() => navigate('/notes')}>
              <FileText className="h-4 w-4" />
              My Notes
            </Button>
            <Button variant="secondary" onClick={signOut}>Sign Out</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard label="Draft notes" value={stats.draft} />
          <StatsCard label="Submitted" value={stats.submitted} />
          <StatsCard label="Approved" value={stats.approved} />
          <StatsCard label="Rejected" value={stats.rejected} />
        </div>

        <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <PageHeader title="Quick actions" description="Open your latest notes or create a new lesson plan." />
          {loading ? (
            <div className="py-16 text-center text-slate-500">Loading notes…</div>
          ) : notes.length === 0 ? (
            <EmptyState title="No lesson notes yet" subtitle="Start with a new note and save your first draft." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.slice(0, 3).map((note) => (
                <div key={note.id} className="rounded-[28px] border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{note.topic}</p>
                      <p className="mt-1 text-sm text-slate-500">Week {note.week} • {note.subject}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">{note.status}</span>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">Updated {new Date(note.updated_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;

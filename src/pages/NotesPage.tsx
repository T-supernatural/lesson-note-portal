import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchTeacherNotes } from '../services/notes';
import Button from '../components/Button';
import NoteCard from '../components/NoteCard';
import EmptyState from '../components/EmptyState';

const NotesPage = () => {
  const { profile } = useAuth();
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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">My notes</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Lesson note history</h1>
            </div>
          </div>
          <Button onClick={() => navigate('/notes/new')}>
            <Plus className="h-4 w-4" />
            New note
          </Button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-soft">Loading notes…</div>
          ) : notes.length === 0 ? (
            <EmptyState title="No notes found" subtitle="Create a lesson note to begin. Saved drafts appear here." />
          ) : (
            notes.map((note) => <NoteCard key={note.id} note={note} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPage;

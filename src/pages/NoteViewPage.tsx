import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchNoteById } from '../services/notes';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

const NoteViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !profile) return;
    setLoading(true);
    fetchNoteById(id)
      .then((data) => {
        if (data.teacher_id === profile.id) {
          setNote(data);
        } else {
          toast.error('You do not have permission to view this note.');
          navigate('/notes');
        }
      })
      .catch(() => {
        toast.error('Unable to load note.');
        navigate('/notes');
      })
      .finally(() => setLoading(false));
  }, [id, profile, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading note…</div>;
  }

  if (!note) {
    return <div className="min-h-screen flex items-center justify-center">Note not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => navigate('/notes')}>
            <ArrowLeft className="h-4 w-4" />
            Back to My Notes
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </Button>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <PageHeader 
            title={note.topic} 
            description={`${note.subject} • ${note.class_level} • Week ${note.week}`}
          />
          
          <div className="mb-6 flex items-center justify-between">
            <div />
            <StatusBadge status={note.status} />
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Term</p>
                <p className="mt-2 text-sm text-slate-600">{note.term}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Class Level</p>
                <p className="mt-2 text-sm text-slate-600">{note.class_level}</p>
              </div>
            </div>

            <section>
              <h2 className="text-sm font-semibold text-slate-900">Learning Objectives</h2>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{note.objectives}</p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-slate-900">Teaching Materials</h2>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{note.materials}</p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-slate-900">Introduction</h2>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{note.introduction}</p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-slate-900">Main Lesson Content</h2>
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

            {note.admin_comment && note.status === 'rejected' && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-900">Admin Comment:</p>
                <p className="mt-2 text-sm text-rose-800 whitespace-pre-line">{note.admin_comment}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteViewPage;

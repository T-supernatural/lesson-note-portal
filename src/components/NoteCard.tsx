import { Link } from 'react-router-dom';
import { Bookmark, Edit3, Eye, Trash2 } from 'lucide-react';
import type { LessonNote } from '../types';
import StatusBadge from './StatusBadge';

const NoteCard = ({ note, onDelete, isDeleting }: { note: LessonNote; onDelete?: (id: string) => void; isDeleting?: boolean }) => {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-slate-500">
            <Bookmark className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.24em]">Week {note.week} • {note.subject}</span>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{note.topic}</h2>
          <p className="mt-2 text-sm text-slate-600">{note.class_level} • {note.term}</p>
          
          {note.admin_comment && note.status === 'rejected' && (
            <div className="mt-3 rounded-lg bg-rose-50 p-3 border border-rose-200">
              <p className="text-xs font-semibold text-rose-900 uppercase tracking-[0.06em]">Admin Comment</p>
              <p className="mt-1 text-sm text-rose-800">{note.admin_comment}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 items-start sm:items-end">
          <StatusBadge status={note.status} />
          <div className="flex gap-2 flex-wrap">
            <Link
              to={`/notes/${note.id}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              <Eye className="h-4 w-4" />
              View
            </Link>
            <Link
              to={`/notes/${note.id}/edit`}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Link>
            {note.status === 'draft' && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(note.id)}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600">Last updated {new Date(note.updated_at).toLocaleDateString()}</p>
    </div>
  );
};

export default NoteCard;

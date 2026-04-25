import clsx from 'clsx';
import type { LessonStatus } from '../types';

const statusStyles: Record<LessonStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-amber-100 text-amber-900',
  approved: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-rose-100 text-rose-900',
};

const StatusBadge = ({ status }: { status: LessonStatus }) => {
  return <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]', statusStyles[status])}>{status}</span>;
};

export default StatusBadge;

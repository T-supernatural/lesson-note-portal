import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning';
};

const toneStyles = {
  neutral: 'border-slate-200 bg-white',
  accent: 'border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)]',
  success: 'border-emerald-200 bg-emerald-50',
  warning: 'border-amber-200 bg-amber-50',
};

const StatCard = ({ label, value, tone = 'neutral' }: StatCardProps) => (
  <div className={`rounded-2xl border p-5 shadow-soft ${toneStyles[tone]}`}>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
  </div>
);

export default StatCard;

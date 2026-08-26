import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

type BottomTab = { label: string; to?: string; icon: LucideIcon; emphasized?: boolean; onClick?: () => void };

const BottomTabBar = ({ items }: { items: BottomTab[] }) => (
  <nav className="fixed inset-x-0 bottom-0 z-40 grid border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden print:hidden" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }} aria-label="Mobile navigation">
    {items.map(({ label, to, icon: Icon, emphasized, onClick }) => onClick ? <button key={label} type="button" onClick={onClick} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium ${emphasized ? 'text-[var(--color-accent)]' : 'text-slate-500'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full ${emphasized ? 'bg-[var(--color-accent)] text-white' : ''}`}><Icon className="h-4 w-4" aria-hidden="true" /></span><span className="truncate">{label}</span></button> : <NavLink key={to || label} to={to || '/'} className={({ isActive }) => `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium ${isActive || emphasized ? 'text-[var(--color-accent)]' : 'text-slate-500'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full ${emphasized ? 'bg-[var(--color-accent)] text-white' : ''}`}><Icon className="h-4 w-4" aria-hidden="true" /></span><span className="truncate">{label}</span></NavLink>)}
  </nav>
);

export default BottomTabBar;

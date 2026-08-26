import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

type SidebarItem = { label: string; to: string; icon: LucideIcon };

const Sidebar = ({ items, logoSrc = '/image/logo.png' }: { items: SidebarItem[]; logoSrc?: string }) => (
  <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white md:flex md:flex-col print:hidden">
    <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5">
      <img src={logoSrc} alt="RealJoy Schools" className="h-12 w-12 object-contain" />
      <div><p className="text-sm font-semibold text-slate-950">RealJoy Schools</p><p className="text-xs text-slate-500">Lesson portal</p></div>
    </div>
    <nav className="flex-1 space-y-1 p-4" aria-label="Primary navigation">
      {items.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</NavLink>)}
    </nav>
  </aside>
);

export default Sidebar;

import type { LucideIcon } from 'lucide-react';
import { Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

type SidebarItem = { label: string; to: string; icon: LucideIcon };

type SidebarProps = {
  items: SidebarItem[];
  logoSrc?: string;
  mobileOpen?: boolean;
  onMobileOpen?: () => void;
  onMobileClose?: () => void;
  onSignOut?: () => void;
};

const Sidebar = ({ items, logoSrc = '/image/logo.png', mobileOpen = false, onMobileOpen, onMobileClose, onSignOut }: SidebarProps) => {
  const links = items.map(({ label, to, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      onClick={onMobileClose}
      className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </NavLink>
  ));

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white md:flex md:flex-col print:hidden">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5">
          <img src={logoSrc} alt="RealJoy Schools" className="h-12 w-12 object-contain" />
          <div><p className="text-sm font-semibold text-slate-950">RealJoy Schools</p><p className="text-xs text-slate-500">Lesson portal</p></div>
        </div>
        <nav className="flex-1 space-y-1 p-4" aria-label="Primary navigation">
          {links}
        </nav>
      </aside>

      <button type="button" onClick={onMobileOpen} className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-soft md:hidden print:hidden" aria-label="Open navigation">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden print:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button type="button" className="absolute inset-0 bg-slate-950/30" aria-label="Close navigation" onClick={onMobileClose} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
              <div className="flex items-center gap-3">
                <img src={logoSrc} alt="RealJoy Schools" className="h-10 w-10 object-contain" />
                <div><p className="text-sm font-semibold text-slate-950">RealJoy Schools</p><p className="text-xs text-slate-500">Lesson portal</p></div>
              </div>
              <button type="button" onClick={onMobileClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Close navigation"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Mobile primary navigation">
              {links}
            </nav>
            {onSignOut ? <button type="button" onClick={onSignOut} className="m-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950">Sign out</button> : null}
          </aside>
        </div>
      ) : null}
    </>
  );
};

export default Sidebar;

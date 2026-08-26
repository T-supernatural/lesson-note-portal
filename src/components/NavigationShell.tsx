import type { ReactNode } from 'react';
import { BarChart3, BookOpen, CalendarClock, ClipboardList, FilePlus2, LayoutDashboard, ListChecks, Settings2, Users } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';
import { useAuth } from '../context/auth-context';

const adminItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Lesson library', to: '/admin/notes', icon: BookOpen },
  { label: 'Teachers', to: '/admin/teachers', icon: Users },
  { label: 'Missing notes', to: '/admin/missing-notes', icon: ListChecks },
  { label: 'Sessions', to: '/admin/sessions', icon: CalendarClock },
  { label: 'Deadlines', to: '/admin/deadlines', icon: ClipboardList },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
];

const NavigationShell = ({ role, children }: { role: 'admin' | 'teacher'; children: ReactNode }) => {
  const { signOut } = useAuth();

  if (role === 'admin') {
    return <div className="min-h-screen md:flex"><Sidebar items={adminItems} /><main className="min-h-screen min-w-0 flex-1">{children}</main></div>;
  }

  return <div className="min-h-screen"><main>{children}</main><BottomTabBar items={[{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }, { label: 'Notes', to: '/notes', icon: BookOpen }, { label: 'New note', to: '/notes/new', icon: FilePlus2, emphasized: true }, { label: 'Sign out', icon: Settings2, onClick: signOut }]} /></div>;
};

export default NavigationShell;

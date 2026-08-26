import { Bell, X } from 'lucide-react';
import { useState } from 'react';
import type { Notification } from '../types';
import Button from './Button';

const NotificationBell = ({ notifications, onRead, onOpenNote }: { notifications: Notification[]; onRead: (notification: Notification) => Promise<void>; onOpenNote: (noteId: string) => void }) => {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return <div className="relative">
    <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-[var(--color-accent)]" onClick={() => setOpen((value) => !value)} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open}><Bell className="h-5 w-5" aria-hidden="true" />{unreadCount ? <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}</button>
    {open ? <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-950">Notifications</h2><button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button></div>{notifications.length ? <div className="max-h-80 space-y-2 overflow-y-auto">{notifications.map((notification) => <div key={notification.id} className={`rounded-xl border p-3 ${notification.read_at ? 'border-slate-100 bg-slate-50' : 'border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)]'}`}><p className="text-sm font-semibold text-slate-950">{notification.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{notification.message}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="text-[11px] text-slate-400">{new Date(notification.created_at).toLocaleDateString()}</span><div className="flex gap-1">{notification.lesson_note_id ? <Button type="button" variant="outline" className="px-2 py-1 text-xs" onClick={() => onOpenNote(notification.lesson_note_id!)}>Open</Button> : null}{!notification.read_at ? <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={() => void onRead(notification)}>Read</Button> : null}</div></div></div>)}</div> : <p className="py-6 text-center text-sm text-slate-500">No notifications yet.</p>}</div> : null}
  </div>;
};

export default NotificationBell;

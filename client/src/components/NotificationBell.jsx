import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { notificationService } from '../services/feedback.js';
import { homeFor } from '../types/constants.js';
import { timeAgo } from '../utils/format.js';
import { cn } from '../utils/cn.js';

export default function NotificationBell() {
  const { user } = useAuth();
  const { unread, setUnread, tick } = useRealtime();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const ref = useRef(null);

  const load = useCallback(() => notificationService.list({ limit: 6 }).then((d) => { setItems(d.notifications); setUnread(d.unread); }).catch(() => setItems([])), [setUnread]);
  useEffect(() => { if (open) load(); }, [open, tick, load]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const markAll = async () => { await notificationService.markAllRead().catch(() => {}); setUnread(0); load(); };
  const markOne = async (n) => {
    if (n.isRead) return;
    await notificationService.markRead(n._id).catch(() => {});
    setUnread((c) => Math.max(0, c - 1));
    setItems((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}
        className="relative grid h-11 w-11 place-items-center rounded-xl text-ink-700 hover:bg-ink-100"
      >
        <Bell size={22} aria-hidden />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-[18px] place-items-center rounded-full bg-stop-600 px-1 text-[11px] font-bold leading-[18px] text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="font-display text-xl font-semibold">Notifications</p>
            {unread > 0 && <button type="button" onClick={markAll} className="text-sm font-semibold text-info-600 hover:underline">Mark all read</button>}
          </div>
          <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
            {items === null && <li className="px-4 py-6 text-center text-sm text-ink-500">Loading...</li>}
            {items?.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-500">No notifications yet</li>}
            {items?.map((n) => (
              <li key={n._id}>
                <button type="button" onClick={() => markOne(n)} className={cn('block w-full px-4 py-3 text-left hover:bg-ink-50', !n.isRead && 'bg-brand-50/70')}>
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.message && <p className="text-sm text-ink-600">{n.message}</p>}
                  <p className="mt-0.5 text-xs text-ink-400">{timeAgo(n.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
          <Link to={`${homeFor(user.role)}/notifications`} onClick={() => setOpen(false)} className="block border-t border-ink-100 px-4 py-3 text-center text-sm font-semibold hover:bg-ink-50">View all</Link>
        </div>
      )}
    </div>
  );
}

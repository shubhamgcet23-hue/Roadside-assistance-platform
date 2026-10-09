import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, Bell, Car, ClipboardList, FileText, History, LayoutDashboard, LogOut, Menu, MapPin, Navigation,
  Power, Settings, ShieldCheck, Siren, User, Users, Wallet, Wrench, X,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import { recallLocation } from '../components/LocationPicker.jsx';
import { Avatar, LoadingState } from '../components/ui/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { cn } from '../utils/cn.js';

const USER_NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/vehicles', label: 'My Vehicles', icon: Car },
  { to: '/app/request', label: 'Request Assistance', icon: Siren },
  { to: '/app/active', label: 'Active Request', icon: Navigation },
  { to: '/app/history', label: 'Service History', icon: History },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/profile', label: 'Profile', icon: User },
];
const PARTNER_NAV = [
  { to: '/partner', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/partner/requests', label: 'Requests', icon: ClipboardList },
  { to: '/partner/active', label: 'Active Job', icon: Navigation },
  { to: '/partner/history', label: 'Job History', icon: History },
  { to: '/partner/earnings', label: 'Earnings', icon: Wallet },
  { to: '/partner/profile', label: 'Profile', icon: User },
  { to: '/partner/availability', label: 'Availability', icon: Power },
];
const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/partners', label: 'Partners', icon: ShieldCheck },
  { to: '/admin/requests', label: 'Service Requests', icon: ClipboardList },
  { to: '/admin/services', label: 'Services', icon: Wrench },
  { to: '/admin/complaints', label: 'Complaints', icon: AlertTriangle },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];
const NAV_BY_ROLE = { USER: USER_NAV, MECHANIC: PARTNER_NAV, TOWING_PARTNER: PARTNER_NAV, ADMIN: ADMIN_NAV };
const BOTTOM_BY_ROLE = {
  USER: ['/app', '/app/vehicles', '/app/request', '/app/history', '/app/profile'],
  MECHANIC: ['/partner', '/partner/requests', '/partner/active', '/partner/history', '/partner/profile'],
  TOWING_PARTNER: ['/partner', '/partner/requests', '/partner/active', '/partner/history', '/partner/profile'],
};
const ROLE_LABEL = { USER: 'Vehicle owner', MECHANIC: 'Mechanic', TOWING_PARTNER: 'Towing partner', ADMIN: 'Administrator' };

function NavItems({ items, onNavigate }) {
  return (
    <nav aria-label="Main" className="space-y-1">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate}
          className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium transition-colors',
            isActive ? 'bg-brand-400 text-ink-950' : 'text-ink-200 hover:bg-white/10 hover:text-white')}
        >
          <Icon size={20} aria-hidden /> {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Sidebar({ items, user, onLogout, onNavigate }) {
  return (
    <div className="on-dark flex h-full flex-col bg-ink-950 p-4">
      <div className="px-1 pb-5 pt-1"><Logo dark to="/" /></div>
      <div className="lane-dash mb-4 opacity-70" aria-hidden />
      <div className="flex-1 overflow-y-auto"><NavItems items={items} onNavigate={onNavigate} /></div>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <Avatar name={user.name} size="sm" className="bg-brand-400 !text-ink-950" />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{user.name}</p><p className="truncate text-xs text-ink-300">{ROLE_LABEL[user.role]}</p></div>
        <button type="button" onClick={onLogout} aria-label="Log out" className="rounded-lg p-2 text-ink-300 hover:bg-white/10 hover:text-white"><LogOut size={18} /></button>
      </div>
    </div>
  );
}

function BottomNav({ role, items }) {
  const order = BOTTOM_BY_ROLE[role];
  if (!order) return null;
  const picked = order.map((to) => items.find((i) => i.to === to)).filter(Boolean);
  return (
    <nav aria-label="Quick navigation" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-1 pt-1.5">
        {picked.map(({ to, label, icon: Icon, end }) => {
          const hero = role === 'USER' && to === '/app/request';
          return (
            <li key={to}>
              <NavLink to={to} end={end} aria-label={label}
                className={({ isActive }) => cn('flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold', hero ? '-mt-6' : isActive ? 'text-ink-950' : 'text-ink-500')}
              >
                {({ isActive }) => (hero ? (
                  <>
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-400 text-ink-950 shadow-lift ring-4 ring-white"><Icon size={26} aria-hidden /></span>
                    <span>Get help</span>
                  </>
                ) : (
                  <>
                    <span className={cn('grid h-8 w-12 place-items-center rounded-full', isActive && 'bg-brand-400')}><Icon size={21} aria-hidden /></span>
                    <span>{label.replace('Service ', '').replace('My ', '').replace('Job ', '')}</span>
                  </>
                ))}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { connected } = useRealtime();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const items = NAV_BY_ROLE[user.role];
  const saved = user.role === 'USER' ? recallLocation() : null;

  useEffect(() => { setDrawer(false); setMenu(false); window.scrollTo(0, 0); }, [pathname]);
  const handleLogout = () => { logout(); navigate('/', { replace: true }); };
  const profilePath = user.role === 'USER' ? '/app/profile' : user.role === 'ADMIN' ? '/admin/settings' : '/partner/profile';

  return (
    <div className="min-h-screen md:pl-64">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 md:block"><Sidebar items={items} user={user} onLogout={handleLogout} /></aside>

      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setDrawer(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <Sidebar items={items} user={user} onLogout={handleLogout} onNavigate={() => setDrawer(false)} />
            <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-3 top-4 rounded-lg p-2 text-ink-300 hover:bg-white/10"><X size={20} /></button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center gap-2 px-3 sm:px-6">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu" className="grid h-11 w-11 place-items-center rounded-xl text-ink-800 hover:bg-ink-100 md:hidden"><Menu size={22} /></button>
          <div className="md:hidden"><Logo to={items[0].to} /></div>
          {user.role === 'USER' && (
            <Link to="/app/request" className="ml-1 hidden max-w-xs items-center gap-2 rounded-xl bg-ink-100 px-3 py-2 text-sm text-ink-700 hover:bg-ink-200 sm:flex">
              <MapPin size={16} aria-hidden /> <span className="truncate">{saved?.address || 'Set your location'}</span>
            </Link>
          )}
          <div className="ml-auto flex items-center gap-1">
            <span className={cn('mr-1 hidden items-center gap-1.5 text-xs font-semibold sm:inline-flex', connected ? 'text-go-600' : 'text-ink-400')} title={connected ? 'Live updates connected' : 'Reconnecting...'}>
              <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-go-500' : 'bg-ink-300')} /> {connected ? 'Live' : 'Offline'}
            </span>
            <NotificationBell />
            <div className="relative">
              <button type="button" onClick={() => setMenu((m) => !m)} aria-label="Account menu" aria-expanded={menu} className="rounded-full"><Avatar name={user.name} size="sm" /></button>
              {menu && (
                <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lift">
                  <div className="border-b border-ink-100 px-4 py-3"><p className="truncate font-semibold">{user.name}</p><p className="truncate text-sm text-ink-500">{user.email}</p></div>
                  <Link to={profilePath} className="block px-4 py-3 text-sm font-medium hover:bg-ink-50">Profile</Link>
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-stop-600 hover:bg-stop-50"><LogOut size={16} aria-hidden /> Log out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main id="main" className={cn('mx-auto px-4 pb-28 pt-5 sm:px-6 md:pb-10', user.role === 'ADMIN' ? 'max-w-7xl' : 'max-w-5xl')}>
        <Suspense fallback={<LoadingState variant="page" />}><Outlet /></Suspense>
      </main>
      <BottomNav role={user.role} items={items} />
    </div>
  );
}

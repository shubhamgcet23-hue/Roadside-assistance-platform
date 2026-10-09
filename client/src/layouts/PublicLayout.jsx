import { Link, Outlet } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { Button } from '../components/ui/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { homeFor } from '../types/constants.js';

export default function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <header className="on-dark absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo dark />
          <nav aria-label="Primary" className="hidden items-center gap-7 text-sm font-medium text-ink-200 md:flex">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#services" className="hover:text-white">Services</a>
            <a href="#why" className="hover:text-white">Why us</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button to={homeFor(user.role)} size="sm">Open dashboard</Button>
            ) : (
              <>
                <Button to="/login" size="sm" variant="outlineLight">Log in</Button>
                <Button to="/register" size="sm" className="hidden sm:inline-flex">Sign up</Button>
              </>
            )}
          </div>
        </div>
      </header>
      <Outlet />
      <footer className="on-dark bg-ink-950 text-ink-300">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          <div>
            <Logo dark />
            <p className="mt-3 max-w-xs text-sm">Fast Help. Right Where You Are. Verified mechanics and towing partners, a tap away.</p>
          </div>
          <div className="text-sm">
            <p className="mb-3 font-semibold text-white">Platform</p>
            <ul className="space-y-2">
              <li><Link to="/register" className="hover:text-white">Get assistance</Link></li>
              <li><Link to="/register?role=MECHANIC" className="hover:text-white">Become a partner</Link></li>
              <li><Link to="/login" className="hover:text-white">Log in</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="mb-3 font-semibold text-white">In an emergency</p>
            <p>If anyone is hurt or in danger, call <a href="tel:112" className="font-semibold text-brand-400">112</a> first.</p>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-xs sm:px-6">&copy; {new Date().getFullYear()} RoadsideAAA. Academic demonstration project.</div>
      </footer>
    </div>
  );
}

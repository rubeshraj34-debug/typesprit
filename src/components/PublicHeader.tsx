import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './ui';
import { useAuth } from '../lib/auth';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/certification', label: 'Certification' },
  { to: '/verify', label: 'Verify Certificate' },
];

export default function PublicHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const cls = ({ isActive }: { isActive: boolean }) => `px-3 py-2 text-sm font-bold border-2 transition-colors ${isActive ? 'border-ink bg-sun' : 'border-transparent hover:border-ink'}`;
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
        <Logo />
        <nav className="hidden md:flex gap-1 ml-6">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end className={cls}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="ml-auto hidden md:flex items-center gap-2">
          {user ? (
            <Link to="/app" className="btn bg-accent text-sm">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn bg-white text-sm">Log in</Link>
              <Link to="/signup" className="btn bg-ink text-white text-sm">Sign up</Link>
            </>
          )}
        </div>
        <button className="md:hidden ml-auto btn bg-white p-2" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t-2 border-ink bg-white px-4 py-4 space-y-2">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block px-3 py-2.5 font-bold border-2 border-ink">{l.label}</Link>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {user ? (
              <Link to="/app" className="btn bg-accent col-span-2">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn bg-white">Log in</Link>
                <Link to="/signup" className="btn bg-ink text-white">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

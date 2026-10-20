import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Keyboard, GraduationCap, Gamepad2, User, LogOut, Award, ShieldCheck } from 'lucide-react';
import { Logo } from './ui';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/practice', label: 'Practice', icon: Keyboard },
  { to: '/app/lessons', label: 'Lessons', icon: GraduationCap },
  { to: '/app/game', label: 'Game', icon: Gamepad2, desktopOnly: true },
  { to: '/app/certificates', label: 'Certify', icon: Award },
  { to: '/app/profile', label: 'Profile', icon: User },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const doLogout = async () => {
    await logout();
    nav('/');
  };
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white border-b-2 border-ink">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          <Logo to="/app" />
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {[...NAV, ...(user?.isAdmin ? [{ to: '/app/admin', label: 'Admin', icon: ShieldCheck, end: false }] : [])].map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 lg:px-3 py-2 text-sm font-bold border-2 transition-all ${isActive ? 'bg-ink text-white border-ink' : 'border-transparent hover:border-ink'}`
                }
              >
                <n.icon className="w-4 h-4" /> {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-8 h-8 grid place-items-center bg-go text-white font-display border-2 border-ink text-sm">
                {user?.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-semibold max-w-[10rem] truncate">{user?.name}</span>
            </div>
            <button onClick={doLogout} className="btn bg-white text-sm py-1.5 px-3" aria-label="Log out">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 pb-28 md:pb-12">
        <Outlet />
      </main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t-2 border-ink grid grid-cols-5" aria-label="Mobile navigation">
        {NAV.filter((n) => !('desktopOnly' in n)).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 text-[0.65rem] font-bold uppercase tracking-wide ${isActive ? 'bg-accent text-ink' : 'text-ink/70'}`
            }
          >
            <n.icon className="w-5 h-5" />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

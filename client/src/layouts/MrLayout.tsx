import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Home, LogOut, Plus, Stethoscope, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { APP_NAME } from '@/config';

export function MrLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Onboarding has its own sticky action bar.
  const hideNav = location.pathname.startsWith('/app/doctors/new');

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-page md:max-w-lg md:border-x md:border-slate-200">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Stethoscope className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-slate-900">{APP_NAME}</p>
            <p className="text-xs text-slate-500">{user?.name}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
          aria-label="Log out"
        >
          <LogOut className="size-5" />
        </button>
      </header>

      <main className={clsx('flex-1', !hideNav && 'pb-24')}>
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white md:max-w-lg">
          <div className="grid grid-cols-3 items-end">
            <TabLink to="/app" end icon={<Home className="size-5" />} label="Home" />
            <div className="flex justify-center">
              <NavLink
                to="/app/doctors/new"
                className="-mt-6 mb-1 flex flex-col items-center gap-1 text-xs font-medium text-brand-700"
              >
                <span className="grid size-14 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-4 ring-white">
                  <Plus className="size-7" />
                </span>
                Onboard
              </NavLink>
            </div>
            <TabLink to="/app/doctors" icon={<Users className="size-5" />} label="Doctors" />
          </div>
        </nav>
      )}
    </div>
  );
}

function TabLink({ to, end, icon, label }: { to: string; end?: boolean; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium',
          isActive ? 'text-brand-700' : 'text-slate-500',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

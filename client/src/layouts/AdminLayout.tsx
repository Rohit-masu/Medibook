import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { LayoutDashboard, LogOut, Stethoscope, UserRoundCog, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useNewDoctorAlerts } from '@/features/admin/useNewDoctorAlerts';
import { APP_NAME } from '@/config';

const nav = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/doctors', label: 'Doctors', icon: Users },
  { to: '/admin/mrs', label: 'MRs', icon: UserRoundCog },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useNewDoctorAlerts();

  const doLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Stethoscope className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-slate-900">{APP_NAME}</p>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
                )
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 px-5 py-4 text-xs text-slate-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live · refreshes every 10s
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-2 md:hidden">
              <div className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
                <Stethoscope className="size-4" />
              </div>
              <span className="font-bold">{APP_NAME}</span>
            </div>
            <div className="hidden text-sm text-slate-500 md:block">Doctor onboarding overview</div>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <button
                onClick={doLogout}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          {/* Compact nav for tablets/phones */}
          <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
            {nav.map(({ to, end, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx(
                    'rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

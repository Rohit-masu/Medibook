import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, ChevronRight, UserPlus, Users } from 'lucide-react';
import { doctorsApi } from '@/api/endpoints';
import { getErrorMessage } from '@/api/client';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { InstallAppCard } from '@/components/InstallAppCard';
import { DoctorRow, DoctorRowSkeleton } from '@/features/doctors/DoctorRow';
import { firstName, greeting, isToday } from '@/lib/format';

export function MrHomePage() {
  const { user } = useAuth();
  const doctors = useQuery({ queryKey: ['doctors', { search: '' }], queryFn: () => doctorsApi.list() });

  const list = doctors.data ?? [];
  const todayCount = list.filter((d) => isToday(d.createdAt)).length;

  return (
    <div className="space-y-5 px-4 pt-5">
      <div>
        <p className="text-sm text-slate-500">{greeting()},</p>
        <h1 className="text-2xl font-bold text-slate-900">{user ? firstName(user.name) : ''} 👋</h1>
        {user?.territory && <p className="mt-0.5 text-sm text-slate-500">Territory: {user.territory}</p>}
      </div>

      <InstallAppCard />

      <Link
        to="/app/doctors/new"
        className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white shadow-lg shadow-brand-700/20 active:scale-[0.99]"
      >
        <span className="grid size-12 place-items-center rounded-xl bg-white/15">
          <UserPlus className="size-6" />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-semibold">Onboard a Doctor</span>
          <span className="block text-sm text-brand-100">Capture photo & details in under a minute</span>
        </span>
        <ChevronRight className="size-5 opacity-80" />
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Users className="size-5" />}
          label="Doctors onboarded"
          value={doctors.isLoading ? null : list.length}
        />
        <StatCard
          icon={<CalendarCheck className="size-5" />}
          label="Onboarded today"
          value={doctors.isLoading ? null : todayCount}
        />
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recently onboarded</h2>
          {list.length > 0 && (
            <Link to="/app/doctors" className="min-h-11 content-center text-sm font-semibold text-brand-700">
              View all
            </Link>
          )}
        </div>
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {doctors.isLoading ? (
            Array.from({ length: 3 }, (_, i) => <DoctorRowSkeleton key={i} />)
          ) : doctors.isError ? (
            <ErrorState message={getErrorMessage(doctors.error)} onRetry={() => doctors.refetch()} />
          ) : list.length === 0 ? (
            <EmptyState
              icon={<Users className="size-7" />}
              title="No doctors yet"
              description="Doctors you onboard will appear here."
            />
          ) : (
            list.slice(0, 5).map((d) => <DoctorRow key={d._id} doctor={d} />)
          )}
        </Card>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | null }) {
  return (
    <Card className="p-4">
      <div className="mb-3 grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600">{icon}</div>
      {value === null ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-slate-900">{value}</p>}
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  );
}

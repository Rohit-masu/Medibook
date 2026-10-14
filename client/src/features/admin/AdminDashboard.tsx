import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, CalendarRange, UserRoundCog, Users } from 'lucide-react';
import { adminApi } from '@/api/endpoints';
import { getErrorMessage } from '@/api/client';
import { Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useLatestDoctors } from './useNewDoctorAlerts';
import { DoctorsTable } from './DoctorsTable';
import { DoctorDrawer } from './DoctorDrawer';

export function AdminDashboard() {
  const [params, setParams] = useSearchParams();
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.stats, refetchInterval: 10_000 });
  // Same query the layout polls for alerts; shares the cache, so no extra requests.
  const latest = useLatestDoctors();

  const s = stats.data;
  const cards = [
    { label: 'Total doctors', value: s?.totalDoctors, icon: Users, tone: 'bg-brand-50 text-brand-600' },
    { label: 'Onboarded today', value: s?.doctorsToday, icon: CalendarCheck, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Last 7 days', value: s?.doctorsThisWeek, icon: CalendarRange, tone: 'bg-blue-50 text-blue-600' },
    {
      label: 'Active MRs today',
      value: s ? `${s.activeMrsToday} / ${s.totalMrs}` : undefined,
      icon: UserRoundCog,
      tone: 'bg-violet-50 text-violet-600',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">New doctors appear here automatically as MRs onboard them.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                {stats.isLoading ? (
                  <Skeleton className="mt-2 h-8 w-16" />
                ) : (
                  <p className="mt-1 text-3xl font-bold text-slate-900">{value ?? '—'}</p>
                )}
              </div>
              <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-5" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Latest onboarded doctors</h2>
            <p className="text-xs text-slate-500">Most recent 10</p>
          </div>
          <Link to="/admin/doctors" className="text-sm font-semibold text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {latest.isError ? (
          <ErrorState message={getErrorMessage(latest.error)} onRetry={() => latest.refetch()} />
        ) : !latest.isLoading && !latest.data?.length ? (
          <EmptyState icon={<Users className="size-7" />} title="No doctors yet" description="Doctors onboarded by MRs will show here." />
        ) : (
          <DoctorsTable
            doctors={latest.data ?? []}
            loading={latest.isLoading}
            highlightToday
            onSelect={(d) => setParams({ id: d._id })}
          />
        )}
      </Card>

      <DoctorDrawer id={params.get('id')} onClose={() => setParams({})} />
    </div>
  );
}

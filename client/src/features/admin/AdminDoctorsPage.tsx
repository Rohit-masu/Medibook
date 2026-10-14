import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { adminApi, doctorsApi } from '@/api/endpoints';
import { getErrorMessage } from '@/api/client';
import { Card, EmptyState, ErrorState } from '@/components/ui';
import { useDebounce } from '@/lib/useDebounce';
import { DoctorsTable } from './DoctorsTable';
import { DoctorDrawer } from './DoctorDrawer';

export function AdminDoctorsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search.trim());
  const mr = params.get('mr') ?? '';

  const mrs = useQuery({ queryKey: ['admin', 'mrs'], queryFn: adminApi.mrs });
  const doctors = useQuery({
    queryKey: ['doctors', { search: debounced, mr }],
    queryFn: () => doctorsApi.list({ search: debounced || undefined, mr: mr || undefined, limit: 200 }),
    placeholderData: keepPreviousData,
  });

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const list = doctors.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-sm text-slate-500">{doctors.isLoading ? 'Loading…' : `${list.length} doctors`}</p>
        </div>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          <div className="relative flex-1 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, clinic, city, phone…"
              className="min-h-10 w-full rounded-xl border border-slate-300 bg-white pr-3 pl-9 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <select
            value={mr}
            onChange={(e) => updateParam('mr', e.target.value || null)}
            className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600"
          >
            <option value="">All MRs</option>
            {mrs.data?.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="overflow-hidden">
        {doctors.isError ? (
          <ErrorState message={getErrorMessage(doctors.error)} onRetry={() => doctors.refetch()} />
        ) : !doctors.isLoading && list.length === 0 ? (
          <EmptyState
            icon={<Users className="size-7" />}
            title={debounced || mr ? 'No matching doctors' : 'No doctors yet'}
            description={debounced || mr ? 'Try a different search or MR filter.' : 'Doctors onboarded by MRs will show here.'}
          />
        ) : (
          <DoctorsTable
            doctors={list}
            loading={doctors.isLoading}
            highlightToday
            onSelect={(d) => updateParam('id', d._id)}
          />
        )}
      </Card>

      <DoctorDrawer id={params.get('id')} onClose={() => updateParam('id', null)} />
    </div>
  );
}

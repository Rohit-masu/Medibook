import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, UserPlus, Users, X } from 'lucide-react';
import { doctorsApi } from '@/api/endpoints';
import { getErrorMessage } from '@/api/client';
import { buttonStyles, Card, EmptyState, ErrorState } from '@/components/ui';
import { useDebounce } from '@/lib/useDebounce';
import { DoctorRow, DoctorRowSkeleton } from './DoctorRow';

export function DoctorsListPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search.trim());

  const doctors = useQuery({
    queryKey: ['doctors', { search: debounced }],
    queryFn: () => doctorsApi.list({ search: debounced || undefined }),
    placeholderData: keepPreviousData,
  });

  const list = doctors.data ?? [];

  return (
    <div className="px-4 pt-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Doctors</h1>
          <p className="text-sm text-slate-500">
            {doctors.isLoading ? 'Loading…' : `${list.length} ${debounced ? 'found' : 'onboarded'}`}
          </p>
        </div>
        <Link to="/app/doctors/new" className={buttonStyles()}>
          <UserPlus className="size-4" /> Add
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, clinic, city…"
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pr-11 pl-11 text-base outline-none placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center text-slate-400"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <Card className="divide-y divide-slate-100 overflow-hidden">
        {doctors.isLoading ? (
          Array.from({ length: 5 }, (_, i) => <DoctorRowSkeleton key={i} />)
        ) : doctors.isError ? (
          <ErrorState message={getErrorMessage(doctors.error)} onRetry={() => doctors.refetch()} />
        ) : list.length === 0 ? (
          debounced ? (
            <EmptyState icon={<Search className="size-7" />} title="No matches" description={`No doctor matches “${debounced}”.`} />
          ) : (
            <EmptyState
              icon={<Users className="size-7" />}
              title="No doctors onboarded yet"
              description="Start by onboarding your first doctor."
              action={
                <Link to="/app/doctors/new" className={buttonStyles()}>
                  <UserPlus className="size-4" /> Onboard Doctor
                </Link>
              }
            />
          )
        ) : (
          list.map((d) => <DoctorRow key={d._id} doctor={d} />)
        )}
      </Card>
    </div>
  );
}

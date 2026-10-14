import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, UserRoundCog } from 'lucide-react';
import { adminApi } from '@/api/endpoints';
import { getErrorMessage } from '@/api/client';
import { Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { formatPhone, timeAgo } from '@/lib/format';

export function AdminMrsPage() {
  const navigate = useNavigate();
  const mrs = useQuery({ queryKey: ['admin', 'mrs'], queryFn: adminApi.mrs });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Medical Representatives</h1>
        <p className="text-sm text-slate-500">Click an MR to see the doctors they onboarded.</p>
      </div>

      <Card className="overflow-hidden">
        {mrs.isError ? (
          <ErrorState message={getErrorMessage(mrs.error)} onRetry={() => mrs.refetch()} />
        ) : !mrs.isLoading && !mrs.data?.length ? (
          <EmptyState icon={<UserRoundCog className="size-7" />} title="No MRs yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Territory</th>
                  <th className="px-4 py-3">Doctors onboarded</th>
                  <th className="px-4 py-3">Last activity</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mrs.isLoading
                  ? Array.from({ length: 2 }, (_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-4" colSpan={6}>
                          <Skeleton className="h-4 w-1/2" />
                        </td>
                      </tr>
                    ))
                  : mrs.data!.map((m) => (
                      <tr
                        key={m._id}
                        onClick={() => navigate(`/admin/doctors?mr=${m._id}`)}
                        className="cursor-pointer hover:bg-brand-50/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 place-items-center rounded-full bg-violet-50 text-xs font-semibold text-violet-700">
                              {m.name
                                .split(' ')
                                .map((p) => p[0])
                                .join('')
                                .slice(0, 2)}
                            </span>
                            <span className="font-semibold text-slate-900">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{formatPhone(m.phone)}</td>
                        <td className="px-4 py-3 text-slate-700">{m.territory ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex min-w-8 justify-center rounded-full bg-brand-50 px-2.5 py-0.5 font-semibold text-brand-700">
                            {m.doctorsOnboarded}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {m.lastOnboardedAt ? timeAgo(m.lastOnboardedAt) : 'No activity yet'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <ChevronRight className="size-4" />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

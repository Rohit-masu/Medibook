import clsx from 'clsx';
import type { Doctor } from '@/api/types';
import { DoctorAvatar } from '@/components/DoctorAvatar';
import { Skeleton } from '@/components/ui';
import { formatDateTime, isToday, timeAgo } from '@/lib/format';

export function DoctorsTable({
  doctors,
  loading,
  onSelect,
  highlightToday,
}: {
  doctors: Doctor[];
  loading?: boolean;
  onSelect: (d: Doctor) => void;
  highlightToday?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-3">Doctor</th>
            <th className="px-4 py-3">Specialty</th>
            <th className="px-4 py-3">Clinic</th>
            <th className="px-4 py-3">City</th>
            <th className="px-4 py-3">Onboarded by</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading
            ? Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={6}>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-full" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </td>
                </tr>
              ))
            : doctors.map((d) => (
                <tr
                  key={d._id}
                  onClick={() => onSelect(d)}
                  className={clsx(
                    'cursor-pointer transition-colors hover:bg-brand-50/50',
                    highlightToday && isToday(d.createdAt) && 'bg-emerald-50/40',
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <DoctorAvatar name={d.name} photoUrl={d.photoUrl} className="size-10 text-xs" />
                      <div>
                        <p className="font-semibold text-slate-900">Dr. {d.name}</p>
                        <p className="text-xs text-slate-500">+91 {d.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{d.specialty}</td>
                  <td className="max-w-48 truncate px-4 py-3 text-slate-700">{d.clinicName}</td>
                  <td className="px-4 py-3 text-slate-700">{d.city}</td>
                  <td className="px-4 py-3 text-slate-700">{d.onboardedBy?.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500" title={formatDateTime(d.createdAt)}>
                    {isToday(d.createdAt) ? (
                      <span className="font-medium text-emerald-700">{timeAgo(d.createdAt)}</span>
                    ) : (
                      formatDateTime(d.createdAt)
                    )}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

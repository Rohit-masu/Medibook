import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Doctor } from '@/api/types';
import { DoctorAvatar } from '@/components/DoctorAvatar';
import { Skeleton } from '@/components/ui';
import { timeAgo } from '@/lib/format';

export function DoctorRow({ doctor }: { doctor: Doctor }) {
  return (
    <Link
      to={`/app/doctors/${doctor._id}`}
      className="flex min-h-18 items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 active:bg-slate-100"
    >
      <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">Dr. {doctor.name}</p>
        <p className="truncate text-sm text-brand-700">{doctor.specialty}</p>
        <p className="truncate text-xs text-slate-500">
          {doctor.clinicName} · {doctor.city}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[11px] whitespace-nowrap text-slate-400">{timeAgo(doctor.createdAt)}</span>
        <ChevronRight className="size-4 text-slate-300" />
      </div>
    </Link>
  );
}

export function DoctorRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}

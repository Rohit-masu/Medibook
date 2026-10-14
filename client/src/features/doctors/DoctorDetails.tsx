import type { ReactNode } from 'react';
import { BadgeCheck, Building2, CalendarDays, IdCard, MapPin, Phone, UserRound } from 'lucide-react';
import type { Doctor } from '@/api/types';
import { formatDateTime, formatPhone } from '@/lib/format';

/** Shared detail list used by both the MR profile and the admin drawer. */
export function DoctorDetails({ doctor, showOnboardedBy }: { doctor: Doctor; showOnboardedBy?: boolean }) {
  return (
    <dl className="divide-y divide-slate-100">
      <Row icon={<Phone className="size-4" />} label="Mobile">
        <a href={`tel:+91${doctor.phone}`} className="font-medium text-brand-700">
          {formatPhone(doctor.phone)}
        </a>
      </Row>
      <Row icon={<Building2 className="size-4" />} label="Clinic">
        {doctor.clinicName}
      </Row>
      <Row icon={<MapPin className="size-4" />} label="Address">
        {doctor.address}, {doctor.city}
      </Row>
      <Row icon={<IdCard className="size-4" />} label="Registration no.">
        {doctor.registrationNo || <span className="text-slate-400">Not provided</span>}
      </Row>
      {showOnboardedBy && (
        <Row icon={<UserRound className="size-4" />} label="Onboarded by">
          {doctor.onboardedBy?.name}
          {doctor.onboardedBy?.territory && <span className="text-slate-500"> · {doctor.onboardedBy.territory}</span>}
        </Row>
      )}
      <Row icon={<CalendarDays className="size-4" />} label="Onboarded on">
        {formatDateTime(doctor.createdAt)}
      </Row>
      <Row icon={<BadgeCheck className="size-4" />} label="Status">
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 capitalize ring-1 ring-emerald-200">
          {doctor.status}
        </span>
      </Row>
    </dl>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="text-sm break-words text-slate-800">{children}</dd>
      </div>
    </div>
  );
}

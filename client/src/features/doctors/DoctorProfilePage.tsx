import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone } from 'lucide-react';
import { doctorsApi } from '@/api/endpoints';
import { getErrorMessage, resolveImageUrl } from '@/api/client';
import { buttonStyles, Card, ErrorState, Skeleton } from '@/components/ui';
import { DoctorAvatar } from '@/components/DoctorAvatar';
import { DoctorDetails } from './DoctorDetails';

export function DoctorProfilePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const doctor = useQuery({ queryKey: ['doctor', id], queryFn: () => doctorsApi.get(id) });

  return (
    <div>
      <div className="relative bg-gradient-to-b from-brand-600 to-brand-700 px-4 pt-3 pb-16 text-white">
        <button
          onClick={() => navigate(-1)}
          className="-ml-2 grid size-11 place-items-center rounded-xl hover:bg-white/10"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </button>
      </div>

      <div className="relative -mt-14 px-4">
        {doctor.isLoading ? (
          <Card className="flex flex-col items-center p-6">
            <Skeleton className="size-28 rounded-full" />
            <Skeleton className="mt-4 h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-28" />
          </Card>
        ) : doctor.isError || !doctor.data ? (
          <Card>
            <ErrorState message={getErrorMessage(doctor.error)} onRetry={() => doctor.refetch()} />
          </Card>
        ) : (
          <>
            <Card className="flex flex-col items-center p-6 text-center">
              <a href={resolveImageUrl(doctor.data.photoUrl)} target="_blank" rel="noreferrer">
                <DoctorAvatar
                  name={doctor.data.name}
                  photoUrl={doctor.data.photoUrl}
                  className="size-28 text-2xl shadow-lg ring-4"
                />
              </a>
              <h1 className="mt-4 text-xl font-bold text-slate-900">Dr. {doctor.data.name}</h1>
              <p className="font-medium text-brand-700">{doctor.data.specialty}</p>
              <a
                href={`tel:+91${doctor.data.phone}`}
                className={buttonStyles({ variant: 'secondary', className: 'mt-4' })}
              >
                <Phone className="size-4" /> Call
              </a>
            </Card>
            <Card className="mt-4 overflow-hidden">
              <DoctorDetails doctor={doctor.data} />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

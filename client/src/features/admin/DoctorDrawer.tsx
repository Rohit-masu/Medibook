import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { doctorsApi } from '@/api/endpoints';
import { getErrorMessage, resolveImageUrl } from '@/api/client';
import { ErrorState, Skeleton } from '@/components/ui';
import { DoctorDetails } from '@/features/doctors/DoctorDetails';

export function DoctorDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const doctor = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorsApi.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id, onClose]);

  if (!id) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Doctor details</h2>
          <button onClick={onClose} className="grid size-10 place-items-center rounded-lg hover:bg-slate-100" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {doctor.isLoading ? (
            <div className="space-y-4 p-6">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : doctor.isError || !doctor.data ? (
            <ErrorState message={getErrorMessage(doctor.error)} onRetry={() => doctor.refetch()} />
          ) : (
            <>
              <div className="p-5">
                <a href={resolveImageUrl(doctor.data.photoUrl)} target="_blank" rel="noreferrer" className="block">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                    <img
                      src={resolveImageUrl(doctor.data.photoUrl)}
                      alt={`Dr. ${doctor.data.name}`}
                      className="size-full object-cover"
                    />
                  </div>
                </a>
                <div className="mt-4">
                  <p className="text-xl font-bold text-slate-900">Dr. {doctor.data.name}</p>
                  <p className="font-medium text-brand-700">{doctor.data.specialty}</p>
                </div>
              </div>
              <DoctorDetails doctor={doctor.data} showOnboardedBy />
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { doctorsApi } from '@/api/endpoints';

export const LATEST_DOCTORS_KEY = ['doctors', 'latest'] as const;
const POLL_MS = 10_000;

/** Latest 10 doctors, polled every 10s. Safe to call from many components (shared cache). */
export function useLatestDoctors() {
  return useQuery({
    queryKey: LATEST_DOCTORS_KEY,
    queryFn: () => doctorsApi.list({ limit: 10 }),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
  });
}

/**
 * Toasts any newly onboarded doctor that wasn't seen before.
 * Mount exactly once (AdminLayout) so alerts fire on every admin page without duplicates.
 */
export function useNewDoctorAlerts() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const seen = useRef<Set<string> | null>(null);
  const latest = useLatestDoctors();

  useEffect(() => {
    const list = latest.data;
    if (!list) return;

    // First load: remember what's already there without alerting.
    if (!seen.current) {
      seen.current = new Set(list.map((d) => d._id));
      return;
    }

    const fresh = list.filter((d) => !seen.current!.has(d._id));
    if (!fresh.length) return;
    fresh.forEach((d) => seen.current!.add(d._id));

    // Oldest first so toasts stack in arrival order.
    [...fresh].reverse().forEach((d) => {
      toast.success(`New doctor: Dr. ${d.name}`, {
        description: `${d.specialty}, ${d.city} · onboarded by ${d.onboardedBy?.name ?? 'MR'}`,
        duration: 8000,
        action: { label: 'View', onClick: () => navigate(`/admin/doctors?id=${d._id}`) },
      });
    });

    queryClient.invalidateQueries({ queryKey: ['admin'] });
    queryClient.invalidateQueries({
      queryKey: ['doctors'],
      predicate: (q) => q.queryKey[1] !== 'latest',
    });
  }, [latest.data, navigate, queryClient]);
}

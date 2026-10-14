import { useState } from 'react';
import clsx from 'clsx';
import { resolveImageUrl } from '@/api/client';

const initials = (name: string) =>
  name
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export function DoctorAvatar({ name, photoUrl, className }: { name: string; photoUrl?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = resolveImageUrl(photoUrl);

  return (
    <div
      className={clsx(
        'grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ring-2 ring-white',
        className ?? 'size-12 text-sm',
      )}
    >
      {src && !failed ? (
        <img src={src} alt={`Dr. ${name}`} className="size-full object-cover" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </div>
  );
}

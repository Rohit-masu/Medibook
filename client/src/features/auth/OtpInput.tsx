import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import clsx from 'clsx';

interface Props {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  invalid?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({ value, onChange, length = 6, invalid, autoFocus }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join('').slice(0, length));
  };

  const handleChange = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean) return setAt(i, '');
    if (clean.length > 1) {
      // Autofill / paste into one box: spread across boxes.
      const merged = (digits.slice(0, i).join('') + clean).slice(0, length);
      onChange(merged);
      focus(merged.length);
      return;
    }
    setAt(i, clean);
    focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      setAt(i - 1, '');
      focus(i - 1);
    } else if (e.key === 'ArrowLeft') focus(i - 1);
    else if (e.key === 'ArrowRight') focus(i + 1);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    focus(pasted.length);
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && i === 0}
          aria-label={`OTP digit ${i + 1}`}
          className={clsx(
            'size-12 rounded-xl border bg-white text-center text-xl font-semibold text-slate-900 outline-none transition sm:size-13',
            'focus:border-brand-600 focus:ring-4 focus:ring-brand-100',
            invalid ? 'border-red-400' : d ? 'border-brand-500' : 'border-slate-300',
          )}
        />
      ))}
    </div>
  );
}

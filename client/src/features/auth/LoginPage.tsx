import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ShieldCheck, Stethoscope } from 'lucide-react';
import { authApi } from '@/api/endpoints';
import { getErrorMessage } from '@/api/client';
import { Button, inputClass } from '@/components/ui';
import { APP_NAME, APP_TAGLINE } from '@/config';
import { formatPhone } from '@/lib/format';
import { useAuth } from './AuthContext';
import { homeFor } from './RequireRole';
import { OtpInput } from './OtpInput';

const RESEND_SECONDS = 30;

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const sendOtp = useMutation({
    mutationFn: () => authApi.sendOtp(phone),
    onSuccess: () => {
      setStep('otp');
      setOtp('');
      setOtpError('');
      setSecondsLeft(RESEND_SECONDS);
      toast.success(`OTP sent to ${formatPhone(phone)}`);
    },
    onError: (err) => setPhoneError(getErrorMessage(err)),
  });

  const verifyOtp = useMutation({
    mutationFn: () => authApi.verifyOtp(phone, otp),
    onSuccess: ({ token, user }) => {
      login(token, user);
      toast.success(`Welcome, ${user.name}`);
      navigate(homeFor(user.role), { replace: true });
    },
    onError: (err) => {
      setOtpError(getErrorMessage(err));
      setOtp('');
    },
  });

  // Auto-submit once all 6 digits are entered.
  useEffect(() => {
    if (step === 'otp' && otp.length === 6 && !verifyOtp.isPending) verifyOtp.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const submitPhone = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPhoneError('Enter a valid 10-digit mobile number');
      return;
    }
    setPhoneError('');
    sendOtp.mutate();
  };

  const submitOtp = (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit OTP');
      return;
    }
    verifyOtp.mutate();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-700 via-brand-600 to-brand-500 lg:flex-row">
      {/* Brand panel */}
      <div className="flex flex-col justify-end px-6 pt-14 pb-8 text-white lg:w-1/2 lg:justify-center lg:px-16">
        <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
          <Stethoscope className="size-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{APP_NAME}</h1>
        <p className="mt-1 text-brand-100">{APP_TAGLINE}</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col rounded-t-3xl bg-white px-6 pt-8 pb-10 lg:items-center lg:justify-center lg:rounded-none">
        <div className="w-full max-w-sm">
          {step === 'phone' ? (
            <form onSubmit={submitPhone} noValidate>
              <h2 className="text-xl font-semibold text-slate-900">Log in</h2>
              <p className="mt-1 text-sm text-slate-500">Enter your registered mobile number</p>

              <div className="mt-6 flex gap-2">
                <span className="grid min-h-12 place-items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 font-medium text-slate-700">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setPhoneError('');
                  }}
                  className={inputClass(!!phoneError) + ' tracking-wide'}
                  aria-label="Mobile number"
                />
              </div>
              {phoneError && <p className="mt-2 text-sm text-red-600">{phoneError}</p>}

              <Button type="submit" size="lg" block className="mt-6" loading={sendOtp.isPending}>
                Get OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={submitOtp} noValidate>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="size-4" /> Change number
              </button>
              <h2 className="text-xl font-semibold text-slate-900">Verify OTP</h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the 6-digit code sent to <span className="font-medium text-slate-800">{formatPhone(phone)}</span>
              </p>

              <div className="mt-6">
                <OtpInput
                  value={otp}
                  onChange={(v) => {
                    setOtp(v);
                    setOtpError('');
                  }}
                  invalid={!!otpError}
                  autoFocus
                />
              </div>
              {otpError && <p className="mt-2 text-sm text-red-600">{otpError}</p>}

              <Button type="submit" size="lg" block className="mt-6" loading={verifyOtp.isPending}>
                Verify & Continue
              </Button>

              <div className="mt-4 text-center text-sm text-slate-500">
                {secondsLeft > 0 ? (
                  <>
                    Resend OTP in <span className="font-medium text-slate-700">0:{String(secondsLeft).padStart(2, '0')}</span>
                  </>
                ) : (
                  <button
                    type="button"
                    className="min-h-11 font-semibold text-brand-700 hover:underline disabled:opacity-60"
                    disabled={sendOtp.isPending}
                    onClick={() => sendOtp.mutate()}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="mt-8 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-800 ring-1 ring-amber-200">
            <ShieldCheck className="mt-px size-4 shrink-0" />
            <span>
              Demo OTP: <b>123456</b>
              <br />
              MR: 9999900001 / 9999900002 · Admin: 9999900000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

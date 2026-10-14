import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import clsx from 'clsx';
import { ArrowLeft, Camera, CheckCircle2, ImageUp, Loader2, RefreshCw, UserPlus, Users } from 'lucide-react';
import { doctorsApi, uploadsApi } from '@/api/endpoints';
import { getErrorMessage } from '@/api/client';
import type { Doctor, NewDoctorInput } from '@/api/types';
import { Button, buttonStyles, Field, inputClass } from '@/components/ui';
import { DoctorAvatar } from '@/components/DoctorAvatar';
import { SPECIALTIES } from '@/config';
import { CameraCapture, canUseLiveCamera } from './CameraCapture';

type Step = 'photo' | 'details' | 'done';
type Form = Omit<NewDoctorInput, 'photoUrl'>;
type Errors = Partial<Record<keyof Form, string>>;

const emptyForm: Form = {
  name: '',
  phone: '',
  specialty: '',
  registrationNo: '',
  clinicName: '',
  address: '',
  city: '',
};

function validate(f: Form): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = 'Enter the doctor’s name';
  if (!/^[6-9]\d{9}$/.test(f.phone)) e.phone = 'Enter a valid 10-digit mobile number';
  if (!f.specialty) e.specialty = 'Select a specialty';
  if (f.clinicName.trim().length < 2) e.clinicName = 'Enter the clinic name';
  if (f.address.trim().length < 5) e.address = 'Enter the full address';
  if (f.city.trim().length < 2) e.city = 'Enter the city';
  return e;
}

export function OnboardDoctorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('photo');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [created, setCreated] = useState<Doctor | null>(null);

  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.85,
      });
      return uploadsApi.image(compressed, 'doctor.jpg');
    },
    onSuccess: (url) => setPhotoUrl(url),
    onError: (err) => toast.error(getErrorMessage(err, 'Photo upload failed. Please retake.')),
  });

  const create = useMutation({
    mutationFn: () => doctorsApi.create({ ...form, phone: form.phone, photoUrl: photoUrl! }),
    onSuccess: (doctor) => {
      setCreated(doctor);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      window.scrollTo({ top: 0 });
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not save doctor')),
  });

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image');
      return;
    }
    setPhotoUrl(null);
    setPreviewUrl(URL.createObjectURL(file));
    upload.mutate(file);
  };

  const [cameraOpen, setCameraOpen] = useState(false);

  // Prefer the in-app live camera (asks for permission); fall back to the phone's camera app
  // where getUserMedia isn't available (e.g. plain HTTP on a phone).
  const openCamera = () => {
    if (canUseLiveCamera()) setCameraOpen(true);
    else cameraRef.current?.click();
  };
  const openGallery = () => galleryRef.current?.click();

  const retake = () => {
    setPhotoUrl(null);
    upload.reset();
    openCamera();
  };

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      toast.error('Doctor photo is required');
      setStep('photo');
      return;
    }
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) {
      toast.error('Please fix the highlighted fields');
      document.querySelector<HTMLElement>(`[name="${Object.keys(v)[0]}"]`)?.focus();
      return;
    }
    create.mutate();
  };

  const reset = () => {
    setStep('photo');
    setPreviewUrl(null);
    setPhotoUrl(null);
    setForm(emptyForm);
    setErrors({});
    setCreated(null);
    upload.reset();
    create.reset();
  };

  if (step === 'done' && created) {
    return (
      <div className="flex min-h-[calc(100dvh-65px)] flex-col items-center justify-center px-6 py-10 text-center">
        <div className="relative">
          <DoctorAvatar name={created.name} photoUrl={created.photoUrl} className="size-32 text-3xl" />
          <CheckCircle2 className="absolute -right-1 -bottom-1 size-10 rounded-full bg-white fill-emerald-500 text-white" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Dr. {created.name} onboarded</h1>
        <p className="mt-1 text-slate-500">
          {created.specialty} · {created.clinicName}, {created.city}
        </p>
        <p className="mt-4 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
          Now visible to your admin
        </p>
        <div className="mt-8 w-full max-w-xs space-y-3">
          <Link to={`/app/doctors/${created._id}`} className={buttonStyles({ size: 'lg', block: true })}>
            View Profile
          </Link>
          <Button variant="secondary" size="lg" block onClick={reset}>
            <UserPlus className="size-4" /> Onboard Another
          </Button>
          <Link to="/app/doctors" className={buttonStyles({ variant: 'ghost', size: 'lg', block: true })}>
            <Users className="size-4" /> Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-65px)] flex-col">
      {/* Title + stepper */}
      <div className="bg-white px-4 pt-3 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => (step === 'details' ? setStep('photo') : navigate(-1))}
            className="-ml-2 grid size-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">Onboard Doctor</h1>
        </div>
        <div className="mt-3 flex gap-2">
          <StepPill index={1} label="Photo" active={step === 'photo'} done={step === 'details'} />
          <StepPill index={2} label="Details" active={step === 'details'} done={false} />
        </div>
      </div>

      {cameraOpen && (
        <CameraCapture
          onCapture={(file) => {
            setCameraOpen(false);
            onFile(file);
          }}
          onClose={() => setCameraOpen(false)}
          onUseNativeCamera={() => {
            setCameraOpen(false);
            cameraRef.current?.click();
          }}
          onChooseGallery={() => {
            setCameraOpen(false);
            openGallery();
          }}
        />
      )}

      {/* Fallback camera input: capture="environment" opens the phone's rear camera app. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {/* Explicit image types (no capture) make Android open the photo picker / gallery rather than offering the camera. */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {step === 'photo' ? (
        <>
          <div className="flex flex-1 flex-col items-center px-6 pt-10 pb-6">
            <button
              type="button"
              onClick={() => (previewUrl ? undefined : openCamera())}
              className={clsx(
                'relative grid size-56 place-items-center overflow-hidden rounded-full',
                previewUrl
                  ? 'ring-4 ring-white shadow-xl'
                  : 'border-2 border-dashed border-brand-200 bg-brand-50 text-brand-600',
              )}
              aria-label="Take photo"
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Doctor preview" className="size-full object-cover" />
                  {upload.isPending && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40 text-white">
                      <div className="flex flex-col items-center gap-2 text-sm font-medium">
                        <Loader2 className="size-7 animate-spin" /> Uploading…
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="size-14" strokeWidth={1.5} />
                  <span className="text-sm font-medium">Tap to capture</span>
                </div>
              )}
              {photoUrl && (
                <CheckCircle2 className="absolute right-6 bottom-6 size-9 rounded-full bg-white fill-emerald-500 text-white" />
              )}
            </button>

            <p className="mt-6 max-w-xs text-center text-sm text-slate-500">
              {upload.isError
                ? 'Upload failed. Please retake the photo.'
                : photoUrl
                  ? 'Photo looks good. Continue to add details.'
                  : 'Take a clear, front-facing photo of the doctor in good light.'}
            </p>

            <button
              type="button"
              onClick={openGallery}
              disabled={upload.isPending}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
            >
              <ImageUp className="size-4" /> {previewUrl ? 'Pick another from gallery' : 'Choose from gallery'}
            </button>
          </div>

          <StickyBar>
            {previewUrl ? (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" size="lg" onClick={retake} disabled={upload.isPending}>
                  <RefreshCw className="size-4" /> Retake
                </Button>
                <Button size="lg" onClick={() => setStep('details')} disabled={!photoUrl} loading={upload.isPending}>
                  Continue
                </Button>
              </div>
            ) : (
              <Button size="lg" block onClick={openCamera}>
                <Camera className="size-5" /> Take Photo
              </Button>
            )}
          </StickyBar>
        </>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 px-4 pt-4 pb-6">
            <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200/70">
              {previewUrl && <img src={previewUrl} alt="" className="size-14 rounded-full object-cover" />}
              <div className="flex-1 text-sm">
                <p className="font-medium text-slate-800">Photo captured</p>
                <p className="text-slate-500">Uploaded successfully</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setStep('photo')}>
                Change
              </Button>
            </div>

            <Field label="Doctor name" required error={errors.name}>
              <div className="flex">
                <span className="grid min-h-12 place-items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3 text-slate-600">
                  Dr.
                </span>
                <input
                  name="name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Full name"
                  autoComplete="off"
                  autoCapitalize="words"
                  className={inputClass(!!errors.name) + ' rounded-l-none'}
                />
              </div>
            </Field>

            <Field label="Mobile number" required error={errors.phone}>
              <div className="flex">
                <span className="grid min-h-12 place-items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3 text-slate-600">
                  +91
                </span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  className={inputClass(!!errors.phone) + ' rounded-l-none'}
                />
              </div>
            </Field>

            <Field label="Specialty" required error={errors.specialty}>
              <select
                name="specialty"
                value={form.specialty}
                onChange={(e) => set('specialty', e.target.value)}
                className={clsx(inputClass(!!errors.specialty), !form.specialty && 'text-slate-400')}
              >
                <option value="" disabled>
                  Select specialty
                </option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s} className="text-slate-900">
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Registration no." hint="Medical council registration number (optional)">
              <input
                name="registrationNo"
                value={form.registrationNo}
                onChange={(e) => set('registrationNo', e.target.value)}
                placeholder="e.g. MMC-2015-12345"
                autoCapitalize="characters"
                className={inputClass()}
              />
            </Field>

            <Field label="Clinic / hospital name" required error={errors.clinicName}>
              <input
                name="clinicName"
                value={form.clinicName}
                onChange={(e) => set('clinicName', e.target.value)}
                placeholder="e.g. City Care Clinic"
                autoCapitalize="words"
                className={inputClass(!!errors.clinicName)}
              />
            </Field>

            <Field label="Address" required error={errors.address}>
              <textarea
                name="address"
                rows={3}
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Shop / floor, building, street, area"
                className={inputClass(!!errors.address) + ' py-3'}
              />
            </Field>

            <Field label="City" required error={errors.city}>
              <input
                name="city"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="e.g. Mumbai"
                autoCapitalize="words"
                className={inputClass(!!errors.city)}
              />
            </Field>
          </div>

          <StickyBar>
            <Button type="submit" size="lg" block loading={create.isPending}>
              Submit & Onboard
            </Button>
          </StickyBar>
        </form>
      )}
    </div>
  );
}

function StepPill({ index, label, active, done }: { index: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <div className={clsx('h-1.5 rounded-full', active || done ? 'bg-brand-600' : 'bg-slate-200')} />
      <span className={clsx('text-xs font-medium', active ? 'text-brand-700' : done ? 'text-slate-600' : 'text-slate-400')}>
        Step {index} · {label}
      </span>
    </div>
  );
}

function StickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-safe sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur">
      <div className="pb-3">{children}</div>
    </div>
  );
}

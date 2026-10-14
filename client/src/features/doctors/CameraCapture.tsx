import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImageUp, Loader2, RefreshCw, SwitchCamera, X } from 'lucide-react';
import { Button } from '@/components/ui';

type Facing = 'environment' | 'user';
type Status = 'starting' | 'live' | 'denied' | 'unavailable' | 'error';

/** Live in-app camera needs a secure context (HTTPS or localhost) and getUserMedia support. */
export const canUseLiveCamera = () =>
  typeof window !== 'undefined' && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
  /** Fall back to the phone's native camera app (input capture). */
  onUseNativeCamera: () => void;
  onChooseGallery: () => void;
}

export function CameraCapture({ onCapture, onClose, onUseNativeCamera, onChooseGallery }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Rear camera by default: the MR photographs the doctor.
  const [facing, setFacing] = useState<Facing>('environment');
  const [status, setStatus] = useState<Status>('starting');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(
    async (mode: Facing) => {
      stop();
      setStatus('starting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setStatus('live');
        const devices = await navigator.mediaDevices.enumerateDevices();
        setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1);
      } catch (err) {
        const name = (err as DOMException)?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') setStatus('denied');
        else if (name === 'NotFoundError' || name === 'OverconstrainedError') setStatus('unavailable');
        else setStatus('error');
      }
    },
    [stop],
  );

  useEffect(() => {
    start(facing);
    return stop;
  }, [facing, start, stop]);

  // Lock page scroll while the camera is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setCapturing(true);

    // Centre square crop, matching the circular guide.
    const side = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - side) / 2;
    const sy = (video.videoHeight - side) / 2;
    const out = Math.min(side, 1024);
    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d')!;
    if (facing === 'user') {
      // Save what the user saw in the mirrored selfie preview.
      ctx.translate(out, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, side, side, 0, 0, out, out);

    canvas.toBlob(
      (blob) => {
        setCapturing(false);
        if (!blob) return;
        stop();
        onCapture(new File([blob], `doctor-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9,
    );
  };

  const fallbackActions = (
    <div className="mt-6 w-full max-w-xs space-y-3">
      <Button size="lg" block onClick={() => start(facing)}>
        <RefreshCw className="size-4" /> Try again
      </Button>
      <Button
        variant="secondary"
        size="lg"
        block
        onClick={() => {
          stop();
          onUseNativeCamera();
        }}
      >
        <Camera className="size-4" /> Open phone camera app
      </Button>
      <Button
        variant="secondary"
        size="lg"
        block
        onClick={() => {
          stop();
          onChooseGallery();
        }}
      >
        <ImageUp className="size-4" /> Choose from gallery
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white" role="dialog" aria-label="Camera">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <button
          onClick={() => {
            stop();
            onClose();
          }}
          className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Close camera"
        >
          <X className="size-6" />
        </button>
        <p className="text-sm font-medium text-white/80">Doctor photo</p>
        <span className="size-11" />
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 size-full object-cover"
          style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
        />

        {status === 'live' && (
          <>
            {/* Circular face guide; everything outside is dimmed. */}
            <div className="pointer-events-none relative aspect-square w-[78%] max-w-sm rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ring-2 ring-white/80" />
            <p className="absolute bottom-6 rounded-full bg-black/50 px-3 py-1 text-sm text-white/90">
              Keep the doctor’s face inside the circle
            </p>
          </>
        )}

        {status === 'starting' && (
          <div className="relative flex flex-col items-center gap-3 px-8 text-center">
            <Loader2 className="size-8 animate-spin" />
            <p className="font-medium">Starting camera…</p>
            <p className="text-sm text-white/70">Tap “Allow” if your browser asks for camera permission.</p>
          </div>
        )}

        {status !== 'live' && status !== 'starting' && (
          <div className="relative flex flex-col items-center px-8 text-center">
            <div className="mb-4 grid size-16 place-items-center rounded-full bg-white/10">
              <Camera className="size-8" />
            </div>
            {status === 'denied' ? (
              <>
                <p className="text-lg font-semibold">Camera permission is blocked</p>
                <p className="mt-2 text-sm text-white/70">
                  Tap the <b>lock / settings icon</b> in the address bar → <b>Permissions</b> → allow <b>Camera</b>, then
                  tap Try again.
                </p>
              </>
            ) : status === 'unavailable' ? (
              <>
                <p className="text-lg font-semibold">No camera found</p>
                <p className="mt-2 text-sm text-white/70">This device has no usable camera. Choose a photo from the gallery instead.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold">Couldn’t start the camera</p>
                <p className="mt-2 text-sm text-white/70">It may be in use by another app. Close it and try again.</p>
              </>
            )}
            {fallbackActions}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 items-center px-6 pt-5 pb-[max(env(safe-area-inset-bottom),20px)]">
        <button
          onClick={() => {
            stop();
            onChooseGallery();
          }}
          className="grid size-12 place-items-center justify-self-start rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Choose from gallery"
        >
          <ImageUp className="size-6" />
        </button>
        <button
          onClick={capture}
          disabled={status !== 'live' || capturing}
          className="grid size-20 place-items-center justify-self-center rounded-full border-4 border-white disabled:opacity-40"
          aria-label="Capture photo"
        >
          <span className="size-15 rounded-full bg-white transition active:scale-90" />
        </button>
        {hasMultipleCameras ? (
          <button
            onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
            disabled={status === 'starting'}
            className="grid size-12 place-items-center justify-self-end rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40"
            aria-label="Switch camera"
          >
            <SwitchCamera className="size-6" />
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

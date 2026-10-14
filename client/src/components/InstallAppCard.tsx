import { useState } from 'react';
import { Download, EllipsisVertical, Share, SquarePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { APP_NAME } from '@/config';
import { useInstallPrompt } from '@/lib/pwa';

const DISMISS_KEY = 'medbook.installDismissed';

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/** "Install the app" card for the MR home screen. Hidden once installed or dismissed. */
export function InstallAppCard() {
  const { mode, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(readDismissed);
  const [showHelp, setShowHelp] = useState(false);

  if (mode === 'installed' || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const onInstall = async () => {
    if (mode === 'prompt') {
      try {
        const ok = await install();
        if (ok) toast.success(`${APP_NAME} installed on your home screen`);
      } catch {
        setShowHelp(true);
      }
    } else {
      setShowHelp(true);
    }
  };

  return (
    <div>
      <div className="relative flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4">
        <img src="/icon-192.png" alt="" className="size-11 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">Install {APP_NAME} app</p>
          <p className="text-xs text-slate-600">One tap from your home screen, full-screen like a native app.</p>
        </div>
        <Button size="md" onClick={onInstall} className="shrink-0">
          <Download className="size-4" /> Install
        </Button>
        <button
          onClick={dismiss}
          className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-white text-slate-400 shadow ring-1 ring-slate-200"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50" onClick={() => setShowHelp(false)}>
          <div
            className="pb-safe w-full max-w-md rounded-t-3xl bg-white px-6 pt-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="How to install"
          >
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-200" />
            <h2 className="text-lg font-bold text-slate-900">Install {APP_NAME}</h2>
            {mode === 'ios' ? (
              <ol className="mt-4 space-y-4 text-sm text-slate-700">
                <Step n={1}>
                  Tap the <Share className="inline size-4 text-blue-600" /> <b>Share</b> button in Safari’s toolbar
                </Step>
                <Step n={2}>
                  Scroll and tap <SquarePlus className="inline size-4" /> <b>Add to Home Screen</b>
                </Step>
                <Step n={3}>
                  Tap <b>Add</b>. {APP_NAME} will appear on your home screen.
                </Step>
              </ol>
            ) : (
              <ol className="mt-4 space-y-4 text-sm text-slate-700">
                <Step n={1}>
                  Open the browser menu <EllipsisVertical className="inline size-4" /> (top-right)
                </Step>
                <Step n={2}>
                  Tap <b>Install app</b> or <b>Add to Home screen</b>
                </Step>
                <Step n={3}>
                  Confirm <b>Install</b>. {APP_NAME} will appear on your home screen.
                </Step>
              </ol>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Tip: install works on the secure (https) link of the app.
            </p>
            <Button size="lg" block className="mt-5 mb-4" onClick={() => setShowHelp(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

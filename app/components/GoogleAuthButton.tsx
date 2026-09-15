'use client';

import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

/** לוגו G הרשמי של Google Identity (viewBox 48). */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" width="22" height="22" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

type GoogleAuthButtonProps = {
  from?: string;
  label: string;
  hint?: string;
};

/** כפתור בסגנון Google Identity — לוגו רשמי, טיפוגרפיה בינונית, מסגרת #747775. */
export default function GoogleAuthButton({ from = '/', label, hint }: GoogleAuthButtonProps) {
  const href = `/api/auth/google?from=${encodeURIComponent(from)}`;
  return (
    <div>
      <a
        href={href}
        onClick={() => trackEvent(AnalyticsEvents.GoogleAuthStarted, { from })}
        className="w-full min-h-[52px] inline-flex items-center justify-center px-4 rounded-xl bg-white text-[#1f1f1f] border border-[#747775] hover:bg-[#f8f9fa] hover:shadow-[0_1px_2px_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 transition-[background-color,box-shadow] duration-150 active:bg-[#eee]"
      >
        <span className="inline-flex items-center justify-center gap-3" dir="ltr">
          <GoogleMark className="shrink-0" />
          <span dir="auto" className="text-[15px] font-medium tracking-[0.25px] leading-none">
            {label}
          </span>
        </span>
      </a>
      {hint ? (
        <p className="mt-2 text-center text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function AuthMethodDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6" aria-hidden>
      <span className="flex-1 h-px bg-slate-200" />
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

export function messageForGoogleAuthError(code: string | null, t: (key: string, fallback?: string) => string): string | null {
  if (!code) return null;
  if (code === 'google_denied') return t('auth.googleDenied');
  if (code === 'google_email') return t('auth.googleEmail');
  if (code === 'google_config') return t('auth.googleConfig');
  if (code.startsWith('google_')) return t('auth.googleError');
  return null;
}

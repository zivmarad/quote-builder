'use client';

import { useEffect } from 'react';

/** תפיסת שגיאות ברמת האפליקציה – מונע מסך לבן ומציג הודעה ידידותית */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4" dir="rtl">
      <h1 className="text-xl font-bold text-slate-800 mb-2">אופס, משהו השתבש</h1>
      <p className="text-slate-600 mb-6 text-center max-w-md">
        אירעה שגיאה. נסה לרענן את הדף או לחזור לדף הבית.
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
      >
        נסה שוב
      </button>
      <a
        href="/"
        className="mt-4 text-slate-600 underline hover:text-slate-800"
      >
        חזרה לדף הבית
      </a>
    </div>
  );
}

'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8" dir="rtl">
      <h2 className="text-xl font-bold">משהו השתבש</h2>
      <p className="text-gray-600 text-center">{error.message || 'אירעה שגיאה לא צפויה'}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        נסה שוב
      </button>
    </div>
  );
}

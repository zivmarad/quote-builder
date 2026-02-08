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

  const friendlyMessage =
    error.message?.toLowerCase().includes('object') && error.message?.toLowerCase().includes('not be found')
      ? 'נראה שנפתחת מתוך וואטסאפ או אפליקציה אחרת. נסה לפתוח את הקישור בדפדפן רגיל (Chrome או Safari): לחץ על החץ או שלוש הנקודות ליד הכתובת ובחר "פתח בדפדפן" או "Open in browser".'
      : error.message || 'אירעה שגיאה לא צפויה';
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8" dir="rtl">
      <h2 className="text-xl font-bold">משהו השתבש</h2>
      <p className="text-gray-600 text-center">{friendlyMessage}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        נסה שוב
      </button>
    </div>
  );
}

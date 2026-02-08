'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
      : error.message || 'אירעה שגיאה חמורה באפליקציה';
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: 'Heebo, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <h1>שגיאה קריטית</h1>
        <p>{friendlyMessage}</p>
        <button
          onClick={reset}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          נסה שוב
        </button>
      </body>
    </html>
  );
}

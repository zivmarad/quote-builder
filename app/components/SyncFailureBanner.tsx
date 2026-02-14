'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { SYNC_FAILED_EVENT } from '../../lib/sync';

/** מציג הודעה כשסנכרון נכשל + כפתור "נסה שוב" (רענון) */
export default function SyncFailureBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener(SYNC_FAILED_EVENT, handler);
    return () => window.removeEventListener(SYNC_FAILED_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 12000);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] max-w-sm w-[calc(100%-2rem)] px-4 py-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-lg flex items-start gap-3"
      dir="rtl"
    >
      <AlertTriangle size={22} className="shrink-0 mt-0.5 text-amber-600" />
      <div className="text-sm flex-1">
        <p className="font-bold mb-1">הסנכרון נכשל</p>
        <p className="text-amber-800/90 mb-2">הנתונים נשמרו במכשיר. נסה שוב כשהחיבור יציב.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 text-amber-800 font-medium hover:underline"
        >
          <RefreshCw size={16} />
          נסה שוב
        </button>
      </div>
    </div>
  );
}

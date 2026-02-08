'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { STORAGE_QUOTA_EVENT } from '../contexts/QuoteBasketContext';

/** מציג התראה כשמגיעים למגבלת localStorage – הסל גדול מדי */
export default function StorageQuotaAlert() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener(STORAGE_QUOTA_EVENT, handler);
    return () => window.removeEventListener(STORAGE_QUOTA_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 8000);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] max-w-sm w-[calc(100%-2rem)] px-4 py-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-lg flex items-start gap-3"
    >
      <AlertTriangle size={22} className="shrink-0 mt-0.5 text-amber-600" />
      <div className="text-sm">
        <p className="font-bold mb-1">הסל מלא – אי אפשר לשמור עוד פריטים</p>
        <p className="text-amber-800/90">
          מחק פריטים קיימים או פצל את ההצעה להצעות נפרדות. הפריטים שכבר בסל יישמרו.
        </p>
      </div>
    </div>
  );
}

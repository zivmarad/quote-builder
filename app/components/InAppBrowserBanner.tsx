'use client';

import { useState, useEffect } from 'react';

const DISMISS_KEY = 'quoteBuilder_inAppBanner_dismissed';

/** מזהה דפדפן מובנה (וואטסאפ, אינסטגרם וכו') – בהן התקנת PWA לא עובדת */
function isLikelyInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const inAppPatterns = [
    /WhatsApp/i,
    /Instagram/i,
    /FBAN|FBAV/i, // Facebook in-app
    /Line\//i,
    /Twitter/i,
    /Snapchat/i,
    /KAKAOTALK/i,
    /WebView|wv\)/i,
  ];
  return inAppPatterns.some((p) => p.test(ua));
}

/**
 * באנר שמנחה לפתוח את האתר בדפדפן כשנכנסים מדפדפן מובנה (וואטסאפ וכו').
 * מקטין את הסיכוי להודעה "לא ניתן להתקין יישום אינטרנט".
 */
export default function InAppBrowserBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    if (!isLikelyInAppBrowser()) return;
    setShow(true);
  }, []);

  const handleOpenInBrowser = () => {
    const url = window.location.href;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="alert"
      className="bg-amber-50 border-b border-amber-200 px-3 py-2.5 flex flex-wrap items-center justify-center gap-2 text-sm text-amber-900"
      dir="rtl"
    >
      <span className="font-medium">
        להתקנה על המכשיר – פתח את האתר בדפדפן Chrome (לא מתוך וואטסאפ).
      </span>
      <button
        type="button"
        onClick={handleOpenInBrowser}
        className="underline font-bold text-amber-800 hover:text-amber-900"
      >
        פתח בדפדפן
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="mr-auto text-amber-600 hover:text-amber-800 text-xs"
        aria-label="סגור"
      >
        ✕
      </button>
    </div>
  );
}

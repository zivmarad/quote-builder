'use client';

import { useEffect } from 'react';

/** רישום Service Worker כדי שהאתר ייחשב "ניתן להתקנה" ב-Chrome (PWA) */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {})
      .catch(() => {});
  }, []);
  return null;
}

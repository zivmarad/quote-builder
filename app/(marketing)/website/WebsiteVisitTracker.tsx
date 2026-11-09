'use client';

import { useEffect } from 'react';
import { recordProductMetric } from '@/lib/product-metrics-client';

const SEEN_KEY = 'quoteBuilder_websiteView';

function sourceLabel(): string {
  if (typeof document === 'undefined') return 'ישיר';
  const ref = document.referrer;
  if (!ref) return 'ישיר';
  try {
    const url = new URL(ref);
    if (url.origin === window.location.origin) {
      const path = url.pathname.replace(/\/$/, '') || '/';
      if (path === '/' || path === '/landing') return 'דף הבית';
      return path.slice(0, 100);
    }
    const host = url.hostname.replace(/^www\./, '');
    if (host.includes('google.')) return 'גוגל';
    if (host.includes('facebook.') || host === 'fb.com' || host.endsWith('facebook.com')) return 'פייסבוק';
    if (host.includes('instagram.')) return 'אינסטגרם';
    if (host.includes('bing.')) return 'בינג';
    return host.slice(0, 80);
  } catch {
    return 'ישיר';
  }
}

/** סופר כניסה אחת לכל ביקור בלשונית, עם המקור שממנו הגיעו. */
export default function WebsiteVisitTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY) === '1') return;
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ממשיכים לספור גם בלי אחסון */
    }
    recordProductMetric('website_view', sourceLabel());
  }, []);

  return null;
}

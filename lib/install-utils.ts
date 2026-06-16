const APP_INSTALLED_KEY = 'quoteBuilder_appInstalled';

/** האם האפליקציה כבר רצה במצב מותקן (standalone) ולכן אין צורך להציע התקנה. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const mql = window.matchMedia?.('(display-mode: standalone)');
    const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    return !!mql?.matches || iosStandalone;
  } catch {
    return false;
  }
}

/** מזהה דפדפן מובנה (וואטסאפ, אינסטגרם וכו') – בהן התקנת PWA לא עובדת */
export function isLikelyInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const inAppPatterns = [
    /WhatsApp/i,
    /Instagram/i,
    /FBAN|FBAV/i,
    /Line\//i,
    /Twitter/i,
    /Snapchat/i,
    /KAKAOTALK/i,
    /WebView|wv\)/i,
  ];
  return inAppPatterns.some((p) => p.test(ua));
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

export function markAppInstalled(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(APP_INSTALLED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isAppMarkedInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(APP_INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

/** האם להציג כפתור/הצעת התקנה (לא במצב standalone ולא אחרי התקנה מוצלחת). */
export function shouldOfferInstall(): boolean {
  return !isStandaloneDisplay() && !isAppMarkedInstalled();
}

export function getSiteUrl(): string {
  if (typeof window === 'undefined') return 'https://hatzaot.co.il';
  return window.location.origin + window.location.pathname;
}

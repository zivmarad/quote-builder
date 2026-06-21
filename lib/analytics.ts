import { track } from '@vercel/analytics';

/**
 * מעטפת דקה סביב Vercel Analytics לאירועים מותאמים.
 * בטוחה לקריאה גם בשרת/בנייה — לא תזרוק אם המודול לא זמין.
 */
type EventProps = Record<string, string | number | boolean | null>;

export function trackEvent(name: string, props?: EventProps): void {
  try {
    track(name, props);
  } catch {
    /* ignore – analytics לעולם לא ישבור flow */
  }
}

/** אירועי המרה מרכזיים – שמות אחידים למעקב נוח ב-Vercel */
export const AnalyticsEvents = {
  AppEnteredGuest: 'app_entered_guest',
  AddToCart: 'add_to_cart',
  CartViewed: 'cart_viewed',
  LoginWallHit: 'login_wall_hit',
  LoginPageViewed: 'login_page_viewed',
  SignupPageViewed: 'signup_page_viewed',
  SignupCompleted: 'signup_completed',
  QuoteExported: 'quote_exported',
} as const;

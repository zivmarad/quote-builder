/**
 * הגבלת קצב פשוטה בזיכרון (לפי מזהה – בדרך כלל IP).
 * ב-Vercel/serverless כל instance מחזיק מפה משלו; מתאים להקטנת סיכון מצד בודד.
 */

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // דקה
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // ניקוי כל 5 דקות

let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, v] of store.entries()) {
    if (v.resetAt < now) store.delete(key);
  }
}

export interface RateLimitOptions {
  /** מכסה בחלון זמן */
  max: number;
  /** אורך החלון במילישניות (ברירת מחדל: דקה) */
  windowMs?: number;
}

/**
 * בודק אם המזהה (למשל IP) במכסה. מחזיר true אם מותר, false אם חרג.
 */
export function checkRateLimit(identifier: string, options: RateLimitOptions): boolean {
  const { max, windowMs = WINDOW_MS } = options;
  const now = Date.now();
  cleanup();

  let entry = store.get(identifier);
  if (!entry) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(identifier, entry);
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

/** מחזיר IP מהבקשה (מתאים ל-Vercel ולפרוקסי). */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

/** מכסות מומלצות */
export const LIMITS = {
  /** שליחת קוד אימייל – למניעת ספאם */
  SEND_CODE: { max: 6, windowMs: 10 * 60 * 1000 },
  /** התחברות / הרשמה */
  AUTH: { max: 25, windowMs: 60 * 1000 },
  /** סנכרון (סל, היסטוריה וכו') */
  SYNC: { max: 80, windowMs: 60 * 1000 },
} as const;

/**
 * Rate limiting:
 * 1) Preferred: Upstash Redis REST (distributed, multi-instance safe).
 * 2) Fallback: in-memory map (dev/local when Upstash env isn't set).
 */

const store = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000; // דקה
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
const hasUpstash = !!upstashUrl && !!upstashToken;

function cleanupMemoryStore(): void {
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

function checkRateLimitInMemory(identifier: string, options: RateLimitOptions): boolean {
  const { max, windowMs = WINDOW_MS } = options;
  const now = Date.now();
  cleanupMemoryStore();

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

async function checkRateLimitUpstash(identifier: string, options: RateLimitOptions): Promise<boolean> {
  const { max, windowMs = WINDOW_MS } = options;
  if (!upstashUrl || !upstashToken) return checkRateLimitInMemory(identifier, options);

  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const key = `rl:${identifier}:${windowMs}:${max}`;
  const endpoint = `${upstashUrl}/pipeline`;
  const body = [
    ['INCR', key],
    ['EXPIRE', key, ttlSeconds, 'NX'],
  ];

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Rate limit Upstash HTTP error:', res.status);
      return true; // fail-open: availability over strict blocking
    }

    const data = (await res.json()) as Array<{ result?: number; error?: string }>;
    const current = typeof data?.[0]?.result === 'number' ? data[0].result : 1;
    return current <= max;
  } catch (e) {
    console.error('Rate limit Upstash request failed:', e);
    return true; // fail-open
  }
}

/**
 * בודק אם המזהה (למשל IP) במכסה. מחזיר true אם מותר, false אם חרג.
 */
export async function checkRateLimit(identifier: string, options: RateLimitOptions): Promise<boolean> {
  if (!hasUpstash) return checkRateLimitInMemory(identifier, options);
  return checkRateLimitUpstash(identifier, options);
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
  /** העלאת לוגו ל־Storage */
  LOGO_UPLOAD: { max: 20, windowMs: 60 * 1000 },
  /** התחזות מנהל למשתמש */
  ADMIN_IMPERSONATE: { max: 25, windowMs: 60 * 1000 },
  /** שמירת מספר הצעה סידורי */
  QUOTE_NUMBER: { max: 80, windowMs: 60 * 1000 },
} as const;

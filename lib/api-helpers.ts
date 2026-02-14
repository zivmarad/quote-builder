import { NextResponse } from 'next/server';
import { getClientIdentifier, checkRateLimit, type RateLimitOptions } from './rate-limit';

const MAX_BODY_BYTES = 1024 * 1024; // 1MB

/** מחזיר תגובת 429 אם חרג ממכסה; אחרת null (המשך לנתיב). */
export function rateLimitResponse(request: Request, options: RateLimitOptions): NextResponse | null {
  const id = getClientIdentifier(request);
  if (checkRateLimit(id, options)) return null;
  return NextResponse.json(
    { ok: false, error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
    { status: 429 }
  );
}

/** בודק Content-Length; מחזיר 413 אם גודל הגוף חורג ממגבלת 1MB. */
export function checkBodySize(request: Request): NextResponse | null {
  const cl = request.headers.get('content-length');
  if (cl) {
    const n = parseInt(cl, 10);
    if (!Number.isNaN(n) && n > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'גודל הנתונים חורג מהמגבלה' },
        { status: 413 }
      );
    }
  }
  return null;
}

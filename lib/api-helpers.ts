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

/** בודק Content-Length; מחזיר 413 אם גודל הגוף חורג ממגבלה. */
export function checkBodySize(request: Request, maxBytes: number = MAX_BODY_BYTES): NextResponse | null {
  const cl = request.headers.get('content-length');
  if (cl) {
    const n = parseInt(cl, 10);
    if (!Number.isNaN(n) && n > maxBytes) {
      return NextResponse.json(
        { ok: false, error: 'גודל הנתונים חורג מהמגבלה' },
        { status: 413 }
      );
    }
  }
  return null;
}

const MAX_PROFILE_BODY_BYTES = 3 * 1024 * 1024; // 3MB לפרופיל (לוגו base64)

export function checkProfileBodySize(request: Request): NextResponse | null {
  return checkBodySize(request, MAX_PROFILE_BODY_BYTES);
}

import { NextResponse } from 'next/server';
import { getClientIdentifier, checkRateLimit, type RateLimitOptions } from './rate-limit';

const MAX_BODY_BYTES = 1024 * 1024; // 1MB

export function getOrCreateRequestId(request: Request): string {
  const existing = request.headers.get('x-request-id')?.trim();
  if (existing) return existing;
  return crypto.randomUUID();
}

export function withRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set('x-request-id', requestId);
  return response;
}

/** מחזיר תגובת 429 אם חרג ממכסה; אחרת null (המשך לנתיב). */
export async function rateLimitResponse(request: Request, options: RateLimitOptions): Promise<NextResponse | null> {
  const id = getClientIdentifier(request);
  const requestId = getOrCreateRequestId(request);
  if (await checkRateLimit(id, options)) return null;
  return withRequestId(
    NextResponse.json(
    { ok: false, error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
    { status: 429 }
    ),
    requestId
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
const MAX_HISTORY_BODY_BYTES = 6 * 1024 * 1024; // 6MB להיסטוריית הצעות גדולה

export function checkProfileBodySize(request: Request): NextResponse | null {
  return checkBodySize(request, MAX_PROFILE_BODY_BYTES);
}

export function checkHistoryBodySize(request: Request): NextResponse | null {
  return checkBodySize(request, MAX_HISTORY_BODY_BYTES);
}

const MAX_SINGLE_QUOTE_BODY_BYTES = 4 * 1024 * 1024; // שורת הצעה בודדת (JSONB)

export function checkSingleQuoteBodySize(request: Request): NextResponse | null {
  return checkBodySize(request, MAX_SINGLE_QUOTE_BODY_BYTES);
}

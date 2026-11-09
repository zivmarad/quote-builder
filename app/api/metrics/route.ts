import { NextResponse } from 'next/server';
import { insertProductEvent, isProductEventName } from '../../../lib/product-events';
import { checkBodySize, rateLimitResponse } from '../../../lib/api-helpers';
import { LIMITS } from '../../../lib/rate-limit';

export async function POST(request: Request) {
  const tooBig = checkBodySize(request, 2048);
  if (tooBig) return tooBig;

  const rateLimited = await rateLimitResponse(request, LIMITS.METRICS);
  if (rateLimited) return rateLimited;

  try {
    let body: unknown;
    try {
      body = JSON.parse(await request.text());
    } catch {
      return NextResponse.json({ ok: true });
    }
    const record = body && typeof body === 'object' ? (body as { name?: unknown; source?: unknown }) : {};
    const name = record.name ?? null;
    if (!isProductEventName(name)) {
      return NextResponse.json({ ok: false, error: 'אירוע לא תקין' }, { status: 400 });
    }
    const source =
      name === 'website_view' && typeof record.source === 'string' ? record.source.slice(0, 120) : undefined;
    await insertProductEvent(name, source);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

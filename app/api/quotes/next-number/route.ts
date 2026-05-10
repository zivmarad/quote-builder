import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth-server';
import { isSupabaseConfigured, supabaseAdmin } from '../../../../lib/supabase-server';
import { rateLimitResponse, withRequestId } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';
import { getRequestLogMeta, logError, logWarn } from '../../../../lib/observability';

const MAX_RETRIES = 6;

export async function POST(request: NextRequest) {
  const meta = getRequestLogMeta(request);
  const json = (body: unknown, init?: ResponseInit) => withRequestId(NextResponse.json(body, init), meta.requestId);
  const rateLimited = await rateLimitResponse(request, LIMITS.QUOTE_NUMBER);
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser(request);
  if (!user) {
    logWarn('Next quote number unauthorized', { ...meta });
    return json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  }
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { data: row, error: readError } = await supabaseAdmin
      .from('quote_counters')
      .select('next_number')
      .eq('user_id', user.id)
      .single();

    if (readError && readError.code !== 'PGRST116') {
      logError('Next quote number read error', { ...meta, userId: user.id, error: readError.message });
      return json({ ok: false, error: 'שגיאה בקריאת מונה' }, { status: 500 });
    }

    if (!row) {
      const { error: insertError } = await supabaseAdmin
        .from('quote_counters')
        .insert({ user_id: user.id, next_number: 2, updated_at: new Date().toISOString() });

      if (!insertError) {
        return NextResponse.json({ ok: true, quoteNumber: 1 });
      }
      // Row already exists (concurrent request) -> retry
      if (insertError.code === '23505') continue;

      logError('Next quote number init error', { ...meta, userId: user.id, error: insertError.message });
      return json({ ok: false, error: 'שגיאה באתחול מונה' }, { status: 500 });
    }

    const current = typeof row.next_number === 'number' && row.next_number >= 1 ? row.next_number : 1;
    const { data: updatedRow, error: updateError } = await supabaseAdmin
      .from('quote_counters')
      .update({ next_number: current + 1, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('next_number', current)
      .select('next_number')
      .maybeSingle();

    if (updateError) {
      logError('Next quote number update error', { ...meta, userId: user.id, error: updateError.message });
      return json({ ok: false, error: 'שגיאה בעדכון מונה' }, { status: 500 });
    }

    if (updatedRow) {
      return json({ ok: true, quoteNumber: current });
    }
  }

  return json(
    { ok: false, error: 'לא ניתן לשמור מספר הצעה כרגע. נסה שוב.' },
    { status: 409 }
  );
}

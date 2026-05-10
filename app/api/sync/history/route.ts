import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase-server';
import { getCurrentUser } from '../../../../lib/auth-server';
import { rateLimitResponse, checkHistoryBodySize } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimited = await rateLimitResponse(request, LIMITS.SYNC);
  if (rateLimited) return rateLimited;
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  const userId = user.id;
  try {
    const { data, error } = await supabaseAdmin!
      .from('quote_history')
      .select('quotes')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Sync history GET:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    const quotes = data?.quotes ?? [];
    return NextResponse.json({ ok: true, quotes: Array.isArray(quotes) ? quotes : [] });
  } catch (e) {
    console.error('Sync history GET:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בטעינה' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await rateLimitResponse(request, LIMITS.SYNC);
  if (rateLimited) return rateLimited;
  const bodyTooBig = checkHistoryBodySize(request);
  if (bodyTooBig) return bodyTooBig;
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { quotes, deletedQuoteIds } = body as { quotes: unknown[]; deletedQuoteIds?: unknown[] };
    if (!Array.isArray(quotes)) {
      return NextResponse.json({ ok: false, error: 'חסר quotes' }, { status: 400 });
    }
    const userId = user.id;
    const deletedIds = Array.isArray(deletedQuoteIds)
      ? deletedQuoteIds.filter((x): x is string => typeof x === 'string')
      : [];

    const { data: existingRow, error: readError } = await supabaseAdmin!
      .from('quote_history')
      .select('quotes')
      .eq('user_id', userId)
      .maybeSingle();
    if (readError) {
      console.error('Sync history POST read:', readError);
      return NextResponse.json({ ok: false, error: readError.message }, { status: 500 });
    }
    const existing = Array.isArray(existingRow?.quotes) ? (existingRow.quotes as unknown[]) : [];
    const byId = new Map<string, Record<string, unknown>>();
    const put = (raw: unknown) => {
      if (!raw || typeof raw !== 'object') return;
      const r = raw as Record<string, unknown>;
      if (typeof r.id !== 'string') return;
      const prev = byId.get(r.id);
      if (!prev) {
        byId.set(r.id, r);
        return;
      }
      const prevTs = typeof prev.createdAt === 'string' ? Date.parse(prev.createdAt) : 0;
      const nextTs = typeof r.createdAt === 'string' ? Date.parse(r.createdAt as string) : 0;
      byId.set(r.id, nextTs >= prevTs ? r : prev);
    };
    existing.forEach(put);
    quotes.forEach(put);
    for (const id of deletedIds) byId.delete(id);
    const mergedQuotes = [...byId.values()].sort((a, b) => {
      const at = typeof a.createdAt === 'string' ? Date.parse(a.createdAt) : 0;
      const bt = typeof b.createdAt === 'string' ? Date.parse(b.createdAt) : 0;
      return bt - at;
    });

    const { error } = await supabaseAdmin!
      .from('quote_history')
      .upsert({ user_id: userId, quotes: mergedQuotes, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      console.error('Sync history POST:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, totalQuotes: mergedQuotes.length });
  } catch (e) {
    console.error('Sync history POST:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשמירה' }, { status: 500 });
  }
}

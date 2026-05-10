import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase-server';
import { getCurrentUser } from '../../../../lib/auth-server';
import { rateLimitResponse, checkSingleQuoteBodySize } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';

/** טעינת כל ההצעות של המשתמש — שורה אחת בטבלת quotes לכל הצעה */
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
      .from('quotes')
      .select('quote_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Sync history GET:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    const rows = data ?? [];
    const quotes = rows
      .map((r) => r.quote_data)
      .filter((q): q is Record<string, unknown> => q != null && typeof q === 'object');
    return NextResponse.json({ ok: true, quotes });
  } catch (e) {
    console.error('Sync history GET:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בטעינה' }, { status: 500 });
  }
}

/**
 * פעולה אחת לבקשה: או upsert להצעה בודדת, או מחיקה לפי id.
 * אין יותר שליחת מערך היסטוריה שלם.
 */
export async function POST(request: NextRequest) {
  const rateLimited = await rateLimitResponse(request, LIMITS.SYNC);
  if (rateLimited) return rateLimited;
  const bodyTooBig = checkSingleQuoteBodySize(request);
  if (bodyTooBig) return bodyTooBig;
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  const userId = user.id;
  try {
    const body = (await request.json()) as { deleteQuoteId?: unknown; quote?: unknown };
    const deleteId = typeof body.deleteQuoteId === 'string' ? body.deleteQuoteId.trim() : '';
    if (deleteId) {
      const { error } = await supabaseAdmin!.from('quotes').delete().eq('user_id', userId).eq('id', deleteId);
      if (error) {
        console.error('Sync history DELETE:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    const raw = body.quote;
    if (!raw || typeof raw !== 'object') {
      return NextResponse.json({ ok: false, error: 'חסר quote או deleteQuoteId' }, { status: 400 });
    }
    const q = raw as Record<string, unknown>;
    const id = typeof q.id === 'string' ? q.id.trim() : '';
    if (!id) {
      return NextResponse.json({ ok: false, error: 'חסר מזהה הצעה' }, { status: 400 });
    }
    const createdAt =
      typeof q.createdAt === 'string' && q.createdAt ? q.createdAt : new Date().toISOString();
    const quoteData = { ...q, id, createdAt };
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin!.from('quotes').upsert(
      {
        id,
        user_id: userId,
        quote_data: quoteData,
        created_at: createdAt,
        updated_at: now,
      },
      { onConflict: 'user_id,id' }
    );
    if (error) {
      console.error('Sync history UPSERT:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Sync history POST:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשמירה' }, { status: 500 });
  }
}

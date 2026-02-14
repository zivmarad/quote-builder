import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase-server';
import { getCurrentUser } from '../../../../lib/auth-server';
import { rateLimitResponse, checkBodySize } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimited = rateLimitResponse(request, LIMITS.SYNC);
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
      .from('quote_basket')
      .select('items')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Sync basket GET:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    const items = data?.items ?? [];
    return NextResponse.json({ ok: true, items: Array.isArray(items) ? items : [] });
  } catch (e) {
    console.error('Sync basket GET:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בטעינה' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = rateLimitResponse(request, LIMITS.SYNC);
  if (rateLimited) return rateLimited;
  const bodyTooBig = checkBodySize(request);
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
    const { items } = body as { items: unknown[] };
    if (!Array.isArray(items)) {
      return NextResponse.json({ ok: false, error: 'חסר items' }, { status: 400 });
    }
    const userId = user.id;
    const { error } = await supabaseAdmin!
      .from('quote_basket')
      .upsert({ user_id: userId, items, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      console.error('Sync basket POST:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Sync basket POST:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשמירה' }, { status: 500 });
  }
}

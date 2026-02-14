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
      .from('price_overrides')
      .select('overrides')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Sync price-overrides GET:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    const overrides = data?.overrides ?? {};
    return NextResponse.json({ ok: true, overrides: typeof overrides === 'object' ? overrides : {} });
  } catch (e) {
    console.error('Sync price-overrides GET:', e);
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
    const { overrides } = body as { overrides: Record<string, number> };
    if (typeof overrides !== 'object') {
      return NextResponse.json({ ok: false, error: 'חסר overrides' }, { status: 400 });
    }
    const userId = user.id;
    const { error } = await supabaseAdmin!
      .from('price_overrides')
      .upsert({ user_id: userId, overrides, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      console.error('Sync price-overrides POST:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Sync price-overrides POST:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשמירה' }, { status: 500 });
  }
}

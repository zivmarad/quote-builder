import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase-server';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'חסר userId' }, { status: 400 });
  }
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
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { userId, overrides } = body as { userId: string; overrides: Record<string, number> };
    if (!userId || typeof overrides !== 'object') {
      return NextResponse.json({ ok: false, error: 'חסר userId או overrides' }, { status: 400 });
    }
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

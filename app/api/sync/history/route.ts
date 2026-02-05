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
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { userId, quotes } = body as { userId: string; quotes: unknown[] };
    if (!userId || !Array.isArray(quotes)) {
      return NextResponse.json({ ok: false, error: 'חסר userId או quotes' }, { status: 400 });
    }
    const { error } = await supabaseAdmin!
      .from('quote_history')
      .upsert({ user_id: userId, quotes, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      console.error('Sync history POST:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Sync history POST:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשמירה' }, { status: 500 });
  }
}

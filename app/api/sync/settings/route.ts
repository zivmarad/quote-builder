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
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Sync settings GET:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    const settings = data?.settings ?? {};
    return NextResponse.json({ ok: true, settings: typeof settings === 'object' ? settings : {} });
  } catch (e) {
    console.error('Sync settings GET:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בטעינה' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { userId, settings } = body as { userId: string; settings: Record<string, unknown> };
    if (!userId || typeof settings !== 'object') {
      return NextResponse.json({ ok: false, error: 'חסר userId או settings' }, { status: 400 });
    }
    const { error } = await supabaseAdmin!
      .from('user_settings')
      .upsert({ user_id: userId, settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      console.error('Sync settings POST:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Sync settings POST:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשמירה' }, { status: 500 });
  }
}

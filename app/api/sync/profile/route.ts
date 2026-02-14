import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase-server';
import { getCurrentUser } from '../../../../lib/auth-server';

export async function GET(request: NextRequest) {
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
      .from('user_profile')
      .select('profile')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Sync profile GET:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    const profile = data?.profile ?? {};
    return NextResponse.json({ ok: true, profile: typeof profile === 'object' ? profile : {} });
  } catch (e) {
    console.error('Sync profile GET:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בטעינה' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase לא מוגדר' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { profile } = body as { profile: Record<string, unknown> };
    if (typeof profile !== 'object') {
      return NextResponse.json({ ok: false, error: 'חסר profile' }, { status: 400 });
    }
    const userId = user.id;
    const { error } = await supabaseAdmin!
      .from('user_profile')
      .upsert({ user_id: userId, profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      console.error('Sync profile POST:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Sync profile POST:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשמירה' }, { status: 500 });
  }
}

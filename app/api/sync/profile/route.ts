import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../../lib/supabase-server';
import { getCurrentUser } from '../../../../lib/auth-server';
import { rateLimitResponse, checkProfileBodySize } from '../../../../lib/api-helpers';
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
  const rateLimited = await rateLimitResponse(request, LIMITS.SYNC);
  if (rateLimited) return rateLimited;
  const bodyTooBig = checkProfileBodySize(request);
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
    const { profile } = body as { profile: Record<string, unknown> };
    if (typeof profile !== 'object' || profile === null) {
      return NextResponse.json({ ok: false, error: 'חסר profile' }, { status: 400 });
    }
    const userId = user.id;

    // הגנה מפני מחיקת לוגו: אם הלקוח שולח לוגו ריק (למשל מירוץ בטעינה) –
    // לא דורסים לוגו קיים שכבר נשמר בשרת.
    const finalProfile: Record<string, unknown> = { ...profile };
    const incomingLogo = typeof profile.logo === 'string' ? profile.logo : '';
    if (!incomingLogo) {
      const { data: existing, error: readErr } = await supabaseAdmin!
        .from('user_profile')
        .select('profile')
        .eq('user_id', userId)
        .single();
      if (readErr && readErr.code !== 'PGRST116') {
        console.error('Sync profile POST (read existing):', readErr);
      }
      const existingProfile = (existing?.profile ?? null) as Record<string, unknown> | null;
      const existingLogo =
        existingProfile && typeof existingProfile.logo === 'string' ? existingProfile.logo : '';
      if (existingLogo) finalProfile.logo = existingLogo;
    }

    const { error } = await supabaseAdmin!
      .from('user_profile')
      .upsert({ user_id: userId, profile: finalProfile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
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

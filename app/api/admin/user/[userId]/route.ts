import { NextResponse } from 'next/server';
import { getUserById, deleteUserById } from '../../../auth/lib/users-store';
import { supabaseAdmin } from '../../../../../lib/supabase-server';

function getAdminKey(request: Request): string | null {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return null;
  const authHeader = request.headers.get('x-admin-key');
  const provided = authHeader;
  return provided === secret ? secret : null;
}

/** פרטי משתמש מלאים – פרופיל, היסטוריה, סל, הגדרות (צפייה בלבד) */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!getAdminKey(request)) {
    return NextResponse.json({ error: 'גישה לא מורשית' }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: 'חסר userId' }, { status: 400 });
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    let profile: Record<string, unknown> = {};
    let quotes: unknown[] = [];
    let basketItems: unknown[] = [];
    let settings: Record<string, unknown> = {};
    let overrides: Record<string, number> = {};

    if (supabaseAdmin) {
      const [profileRes, historyRes, basketRes, settingsRes, overridesRes] = await Promise.all([
        supabaseAdmin.from('user_profile').select('profile').eq('user_id', userId).maybeSingle(),
        supabaseAdmin.from('quote_history').select('quotes').eq('user_id', userId).maybeSingle(),
        supabaseAdmin.from('quote_basket').select('items').eq('user_id', userId).maybeSingle(),
        supabaseAdmin.from('user_settings').select('settings').eq('user_id', userId).maybeSingle(),
        supabaseAdmin.from('price_overrides').select('overrides').eq('user_id', userId).maybeSingle(),
      ]);
      profile = (profileRes.data?.profile as Record<string, unknown>) ?? {};
      const h = historyRes.data?.quotes;
      quotes = Array.isArray(h) ? h : [];
      const b = basketRes.data?.items;
      basketItems = Array.isArray(b) ? b : [];
      settings = (settingsRes.data?.settings as Record<string, unknown>) ?? {};
      overrides = (overridesRes.data?.overrides as Record<string, number>) ?? {};
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email ?? null,
        createdAt: user.createdAt,
      },
      profile,
      quotes,
      basketItems,
      settings,
      overrides,
    });
  } catch (e) {
    console.error('Admin user detail error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

/** מוחק משתמש ואת כל הנתונים המשויכים – נגיש רק לאדמין */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!getAdminKey(request)) {
    return NextResponse.json({ error: 'גישה לא מורשית' }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: 'חסר userId' }, { status: 400 });
  }

  try {
    const deleted = await deleteUserById(userId);
    if (!deleted) {
      return NextResponse.json({ error: 'משתמש לא נמצא או לא ניתן למחוק' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, message: 'המשתמש הוסר' });
  } catch (e) {
    console.error('Admin delete user error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

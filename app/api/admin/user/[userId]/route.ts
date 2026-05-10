import { NextResponse } from 'next/server';
import { getUserById, deleteUserById } from '../../../auth/lib/users-store';
import { supabaseAdmin } from '../../../../../lib/supabase-server';
import { getAdminKeyFromRequest } from '../../../../../lib/admin-config';
import { logAdminAudit } from '../../../../../lib/admin-audit';

function getAdminKey(request: Request): string | null {
  return getAdminKeyFromRequest(request);
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

  const url = new URL(request.url);
  const quotesPage = Math.max(1, parseInt(url.searchParams.get('quotesPage') ?? '1', 10) || 1);
  const quotesPageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('quotesPageSize') ?? '20', 10) || 20));

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
    let totalQuotes = 0;

    if (supabaseAdmin) {
      const from = (quotesPage - 1) * quotesPageSize;
      const to = from + quotesPageSize - 1;
      const [profileRes, countRes, quoteRowsRes, basketRes, settingsRes, overridesRes] = await Promise.all([
        supabaseAdmin.from('user_profile').select('profile').eq('user_id', userId).maybeSingle(),
        supabaseAdmin.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabaseAdmin
          .from('quotes')
          .select('quote_data')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(from, to),
        supabaseAdmin.from('quote_basket').select('items').eq('user_id', userId).maybeSingle(),
        supabaseAdmin.from('user_settings').select('settings').eq('user_id', userId).maybeSingle(),
        supabaseAdmin.from('price_overrides').select('overrides').eq('user_id', userId).maybeSingle(),
      ]);
      profile = (profileRes.data?.profile as Record<string, unknown>) ?? {};
      quotes = (quoteRowsRes.data ?? [])
        .map((r) => r.quote_data)
        .filter((q): q is Record<string, unknown> => q != null && typeof q === 'object');
      const b = basketRes.data?.items;
      basketItems = Array.isArray(b) ? b : [];
      settings = (settingsRes.data?.settings as Record<string, unknown>) ?? {};
      overrides = (overridesRes.data?.overrides as Record<string, number>) ?? {};
      totalQuotes = typeof countRes.count === 'number' ? countRes.count : quotes.length;
    }
    const quotesTotalPages = Math.max(1, Math.ceil(totalQuotes / quotesPageSize));
    const pagedQuotes = quotes;

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email ?? null,
        createdAt: user.createdAt,
      },
      profile,
      quotes: pagedQuotes,
      quotesPagination: {
        total: totalQuotes,
        page: quotesPage,
        pageSize: quotesPageSize,
        totalPages: quotesTotalPages,
      },
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
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }
    const deleted = await deleteUserById(userId);
    if (!deleted) {
      return NextResponse.json({ error: 'משתמש לא נמצא או לא ניתן למחוק' }, { status: 404 });
    }
    await logAdminAudit(request, 'admin_user_deleted', {
      targetUserId: user.id,
      targetUsername: user.username,
      targetEmail: user.email ?? null,
    });
    return NextResponse.json({ ok: true, message: 'המשתמש הוסר' });
  } catch (e) {
    console.error('Admin delete user error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

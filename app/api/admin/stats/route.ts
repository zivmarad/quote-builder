import { NextResponse } from 'next/server';
import { getUsersCount, getNewUsersCount } from '../../auth/lib/users-store';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAdminKeyFromRequest } from '../../../../lib/admin-config';

/** מפתח אדמין – רק מ-header (לא מ-URL) */
function getAdminKey(request: Request): string | null {
  return getAdminKeyFromRequest(request);
}

/** סטטיסטיקות אדמין – משתמשים חדשים, סה"כ הצעות */
export async function GET(request: Request) {
  if (!getAdminKey(request)) {
    return NextResponse.json({ error: 'גישה לא מורשית' }, { status: 401 });
  }

  try {
    const [totalUsers, newUsers7d, newUsers30d] = await Promise.all([
      getUsersCount(),
      getNewUsersCount(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      getNewUsersCount(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    let totalQuotes = 0;
    let quotesLast7d = 0;
    let quotesLast30d = 0;
    let totalRevenue = 0;
    const usersWithQuotes = new Set<string>();
    let usersWithBasket = 0;
    let totalBasketLineItems = 0;

    const now = Date.now();
    const t7 = now - 7 * 24 * 60 * 60 * 1000;
    const t30 = now - 30 * 24 * 60 * 60 * 1000;

    if (supabaseAdmin) {
      const [{ data: historyRows }, { data: basketRows }] = await Promise.all([
        supabaseAdmin.from('quote_history').select('user_id, quotes'),
        supabaseAdmin.from('quote_basket').select('user_id, items'),
      ]);

      if (historyRows) {
        for (const row of historyRows) {
          const uid = typeof row?.user_id === 'string' ? row.user_id : '';
          const arr = row?.quotes;
          if (!Array.isArray(arr)) continue;
          for (const q of arr) {
            totalQuotes++;
            if (uid) usersWithQuotes.add(uid);
            const rec = q as Record<string, unknown>;
            const tw = typeof rec.totalWithVAT === 'number' ? rec.totalWithVAT : 0;
            totalRevenue += tw;
            const ca = rec.createdAt;
            if (typeof ca === 'string') {
              const ts = new Date(ca).getTime();
              if (!Number.isNaN(ts)) {
                if (ts >= t7) quotesLast7d++;
                if (ts >= t30) quotesLast30d++;
              }
            }
          }
        }
      }

      if (basketRows) {
        for (const row of basketRows) {
          const items = row?.items;
          const n = Array.isArray(items) ? items.length : 0;
          totalBasketLineItems += n;
          if (n > 0) usersWithBasket++;
        }
      }
    }

    const activeQuoteUsers = usersWithQuotes.size;
    const avgQuotesPerActiveUser =
      activeQuoteUsers > 0 ? Math.round((totalQuotes / activeQuoteUsers) * 10) / 10 : 0;
    const avgRevenuePerQuote =
      totalQuotes > 0 ? Math.round((totalRevenue / totalQuotes) * 10) / 10 : 0;

    return NextResponse.json({
      totalUsers,
      newUsers7d,
      newUsers30d,
      totalQuotes,
      quotesLast7d,
      quotesLast30d,
      totalRevenue,
      usersWithQuotes: activeQuoteUsers,
      usersWithBasket,
      totalBasketLineItems,
      avgQuotesPerActiveUser,
      avgRevenuePerQuote,
    });
  } catch (e) {
    console.error('Admin stats error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

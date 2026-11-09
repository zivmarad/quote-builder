import { NextResponse } from 'next/server';
import { getUsersList } from '../../auth/lib/users-store';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAdminKeyFromRequest } from '../../../../lib/admin-config';
import { getWebsiteViewStats } from '../../../../lib/product-events';

function money(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** כניסות לדף הנחיתה וההצעות האחרונות שיצאו */
export async function GET(request: Request) {
  if (!getAdminKeyFromRequest(request)) {
    return NextResponse.json({ error: 'גישה לא מורשית' }, { status: 401 });
  }

  try {
    const website = await getWebsiteViewStats();
    let recentQuotes: {
      id: string;
      userId: string;
      username: string;
      customerName: string;
      total: number | null;
      status: string;
      createdAt: string;
    }[] = [];

    if (supabaseAdmin) {
      const [{ data }, users] = await Promise.all([
        supabaseAdmin
          .from('quotes')
          .select('id, user_id, created_at, quote_data')
          .order('created_at', { ascending: false })
          .limit(40),
        getUsersList(),
      ]);
      const byId = new Map(users.map((user) => [user.id, user]));
      recentQuotes = (data ?? []).map((row) => {
        const quote =
          row.quote_data && typeof row.quote_data === 'object'
            ? (row.quote_data as Record<string, unknown>)
            : {};
        const customer = typeof quote.customerName === 'string' ? quote.customerName.trim() : '';
        const createdAt =
          typeof quote.createdAt === 'string' && quote.createdAt
            ? quote.createdAt
            : typeof row.created_at === 'string'
              ? row.created_at
              : '';
        return {
          id: String(row.id ?? ''),
          userId: typeof row.user_id === 'string' ? row.user_id : '',
          username: byId.get(typeof row.user_id === 'string' ? row.user_id : '')?.username ?? '—',
          customerName: customer || 'ללא שם לקוח',
          total: money(quote.totalWithVAT),
          status: typeof quote.status === 'string' ? quote.status : '',
          createdAt,
        };
      });
    }

    return NextResponse.json({ website, recentQuotes });
  } catch (e) {
    console.error('Admin activity error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getUsersList, getUsersPage } from '../../auth/lib/users-store';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAdminKeyFromRequest } from '../../../../lib/admin-config';

/** מפתח אדמין – רק מ-header (לא מ-URL, למניעת דליפה ללוגים/היסטוריה) */
function getAdminKey(request: Request): string | null {
  return getAdminKeyFromRequest(request);
}

/** רשימת נרשמים עם מספר הצעות – נגיש רק עם סיסמת ניהול */
export async function GET(request: Request) {
  if (!getAdminKey(request)) {
    return NextResponse.json({ error: 'גישה לא מורשית' }, { status: 401 });
  }

  try {
    const quoteCountByUser: Record<string, number> = {};
    const lastQuoteByUser: Record<string, string> = {};
    if (supabaseAdmin) {
      const { data: quoteRows } = await supabaseAdmin.from('quotes').select('user_id, created_at');
      if (quoteRows) {
        for (const row of quoteRows) {
          const uid = typeof row?.user_id === 'string' ? row.user_id : '';
          if (!uid) continue;
          quoteCountByUser[uid] = (quoteCountByUser[uid] ?? 0) + 1;
          const at = typeof row.created_at === 'string' ? row.created_at : '';
          if (at && at > (lastQuoteByUser[uid] ?? '')) lastQuoteByUser[uid] = at;
        }
      }
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '25', 10) || 25));
    const search = (url.searchParams.get('search') ?? '').trim();
    const filter = (url.searchParams.get('filter') ?? 'all').trim();
    const sort = (url.searchParams.get('sort') ?? 'recent').trim();

    const now = Date.now();
    const sinceIso =
      filter === '7d'
        ? new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
        : filter === '30d'
          ? new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

    if (sort === 'top_quotes' || sort === 'last_quote') {
      const users = await getUsersList();
      let list = users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email ?? '—',
        createdAt: u.createdAt,
        quoteCount: quoteCountByUser[u.id] ?? 0,
        lastQuoteAt: lastQuoteByUser[u.id] ?? null,
      }));
      if (sinceIso) {
        const sinceTs = new Date(sinceIso).getTime();
        list = list.filter((u) => new Date(u.createdAt).getTime() >= sinceTs);
      }
      if (search) {
        const q = search.toLowerCase();
        list = list.filter((u) => u.username.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q)));
      }
      if (sort === 'last_quote') {
        list.sort((a, b) => {
          const at = a.lastQuoteAt ?? '';
          const bt = b.lastQuoteAt ?? '';
          if (at !== bt) return at ? (bt ? bt.localeCompare(at) : -1) : 1;
          return b.quoteCount - a.quoteCount;
        });
      } else {
        list.sort((a, b) => b.quoteCount - a.quoteCount);
      }
      const total = list.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const from = (page - 1) * pageSize;
      const usersPage = list.slice(from, from + pageSize);
      return NextResponse.json({ users: usersPage, total, page, pageSize, totalPages });
    }

    const { users, total } = await getUsersPage({ page, pageSize, search, sinceIso });
    const usersPage = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email ?? '—',
      createdAt: u.createdAt,
      quoteCount: quoteCountByUser[u.id] ?? 0,
      lastQuoteAt: lastQuoteByUser[u.id] ?? null,
    }));
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return NextResponse.json({ users: usersPage, total, page, pageSize, totalPages });
  } catch (e) {
    console.error('Admin users error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

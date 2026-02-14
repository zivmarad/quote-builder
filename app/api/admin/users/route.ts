import { NextResponse } from 'next/server';
import { getUsersList } from '../../auth/lib/users-store';
import { supabaseAdmin } from '../../../../lib/supabase-server';

/** מפתח אדמין – רק מ-header (לא מ-URL, למניעת דליפה ללוגים/היסטוריה) */
function getAdminKey(request: Request): string | null {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return null;
  const provided = request.headers.get('x-admin-key');
  return provided === secret ? secret : null;
}

/** רשימת נרשמים עם מספר הצעות – נגיש רק עם סיסמת ניהול */
export async function GET(request: Request) {
  if (!getAdminKey(request)) {
    return NextResponse.json({ error: 'גישה לא מורשית' }, { status: 401 });
  }

  try {
    const users = await getUsersList();
    const quoteCountByUser: Record<string, number> = {};
    if (supabaseAdmin) {
      const { data: historyRows } = await supabaseAdmin.from('quote_history').select('user_id, quotes');
      if (historyRows) {
        for (const row of historyRows) {
          const uid = row?.user_id;
          const q = row?.quotes;
          if (uid) quoteCountByUser[uid] = Array.isArray(q) ? q.length : 0;
        }
      }
    }

    const list = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email ?? '—',
      createdAt: u.createdAt,
      quoteCount: quoteCountByUser[u.id] ?? 0,
    }));
    return NextResponse.json({ users: list });
  } catch (e) {
    console.error('Admin users error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

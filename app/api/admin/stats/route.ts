import { NextResponse } from 'next/server';
import { readUsers } from '../../auth/lib/users-store';
import { supabaseAdmin } from '../../../../lib/supabase-server';

function getAdminKey(request: Request): string | null {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return null;
  const authHeader = request.headers.get('x-admin-key');
  const urlKey = new URL(request.url).searchParams.get('key');
  const provided = authHeader ?? urlKey;
  return provided === secret ? secret : null;
}

/** סטטיסטיקות אדמין – משתמשים חדשים, סה"כ הצעות */
export async function GET(request: Request) {
  if (!getAdminKey(request)) {
    return NextResponse.json({ error: 'גישה לא מורשית' }, { status: 401 });
  }

  try {
    const users = await readUsers();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = new Date(now - 7 * day).toISOString();
    const thirtyDaysAgo = new Date(now - 30 * day).toISOString();

    const newUsers7 = users.filter((u) => u.createdAt >= sevenDaysAgo).length;
    const newUsers30 = users.filter((u) => u.createdAt >= thirtyDaysAgo).length;

    let totalQuotes = 0;
    if (supabaseAdmin) {
      const { data: historyRows } = await supabaseAdmin.from('quote_history').select('quotes');
      if (historyRows) {
        for (const row of historyRows) {
          const q = row?.quotes;
          totalQuotes += Array.isArray(q) ? q.length : 0;
        }
      }
    }

    return NextResponse.json({
      totalUsers: users.length,
      newUsers7d: newUsers7,
      newUsers30d: newUsers30,
      totalQuotes,
    });
  } catch (e) {
    console.error('Admin stats error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

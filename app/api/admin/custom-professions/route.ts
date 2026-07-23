import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { getAdminKeyFromRequest } from '../../../../lib/admin-config';

/** רשימת מקצועות מותאמים שמשתמשים יצרו – למעקב אדמין */
export async function GET(request: NextRequest) {
  if (!getAdminKeyFromRequest(request)) {
    return NextResponse.json({ error: 'גישה לא מורשית' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '30', 10) || 30));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const { data, error, count } = await supabaseAdmin
      .from('custom_profession_events')
      .select(
        'id, user_id, username, email, category_id, category_name, icon, services_snapshot, created_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      // טבלה עדיין לא קיימת בסביבה – לא שוברים את האדמין
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          ok: true,
          events: [],
          total: 0,
          page,
          pageSize,
          totalPages: 1,
          tableMissing: true,
        });
      }
      console.error('Admin custom professions GET:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = typeof count === 'number' ? count : data?.length ?? 0;
    return NextResponse.json({
      ok: true,
      events: data ?? [],
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    console.error('Admin custom professions GET:', e);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

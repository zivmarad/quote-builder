import { NextResponse } from 'next/server';
import { readUsers } from '../../auth/lib/users-store';

/** רשימת נרשמים – נגיש רק עם סיסמת ניהול (ADMIN_SECRET ב-.env.local) */
export async function GET(request: Request) {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: 'ניהול לא מוגדר. הוסף ADMIN_SECRET ל-.env.local' },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get('x-admin-key');
  const urlKey = new URL(request.url).searchParams.get('key');
  const provided = authHeader ?? urlKey;
  if (provided !== secret) {
    return NextResponse.json({ error: 'גישה לא מורשית' }, { status: 401 });
  }

  try {
    const users = await readUsers();
    const list = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email ?? '—',
      createdAt: u.createdAt,
    }));
    return NextResponse.json({ users: list });
  } catch (e) {
    console.error('Admin users error:', e);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

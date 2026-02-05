import { NextResponse } from 'next/server';

/** כניסת אדמין – שם משתמש וסיסמה. מחזיר מפתח לשימוש ב־X-Admin-Key. */
export async function POST(request: Request) {
  const username = process.env.ADMIN_USERNAME?.trim() ?? 'admin';
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'ניהול לא מוגדר. הגדר ADMIN_SECRET ו־ADMIN_USERNAME ב-.env' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const u = typeof body.username === 'string' ? body.username.trim() : '';
    const p = typeof body.password === 'string' ? body.password : '';
    if (u !== username || p !== secret) {
      return NextResponse.json({ ok: false, error: 'שם משתמש או סיסמה שגויים' }, { status: 401 });
    }
    return NextResponse.json({ ok: true, key: secret });
  } catch {
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

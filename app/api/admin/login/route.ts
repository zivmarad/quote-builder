import { NextResponse } from 'next/server';
import { resolvedAdminSecret, resolvedAdminUsername } from '../../../../lib/admin-config';

/** כניסת אדמין – שם משתמש וסיסמה. מחזיר מפתח לשימוש ב־X-Admin-Key. */
export async function POST(request: Request) {
  const username = resolvedAdminUsername();
  const secret = resolvedAdminSecret();

  try {
    const body = await request.json();
    const u = typeof body.username === 'string' ? body.username.trim() : '';
    const p = typeof body.password === 'string' ? body.password : '';
    // תאימות לגרסה הישנה: שדה יחיד = רק סיסמת הניהול (ADMIN_SECRET), בלי שם משתמש
    const legacySingleSecret = u === '' && p === secret;
    const fullCreds = u === username && p === secret;
    if (!legacySingleSecret && !fullCreds) {
      return NextResponse.json({ ok: false, error: 'שם משתמש או סיסמה שגויים' }, { status: 401 });
    }
    return NextResponse.json({ ok: true, key: secret });
  } catch {
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

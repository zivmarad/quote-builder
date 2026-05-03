import { NextResponse } from 'next/server';
import { tryAdminLogin } from '../../../../lib/admin-config';

/** כניסת אדמין – שם משתמש וסיסמה. מחזיר מפתח לשימוש ב־X-Admin-Key. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const u = typeof body.username === 'string' ? body.username : '';
    const p = typeof body.password === 'string' ? body.password : '';
    const ok = tryAdminLogin(u, p);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'שם משתמש או סיסמה שגויים' }, { status: 401 });
    }
    return NextResponse.json({ ok: true, key: ok.key });
  } catch {
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

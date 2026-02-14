import { NextResponse } from 'next/server';
import { getUserByLogin } from '../lib/users-store';
import { consumeVerificationCode } from '../lib/verification-codes-store';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** מאמת קוד ומחזיר משתמש קיים אם יש (לפי אימייל). לא יוצר משתמש חדש. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: 'כתובת אימייל לא תקינה' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: 'הקוד חייב להכיל 6 ספרות' }, { status: 400 });
    }

    const valid = await consumeVerificationCode(email, code);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'קוד לא תקין או שפג תוקפו' }, { status: 401 });
    }

    const user = await getUserByLogin(email);
    return NextResponse.json({
      ok: true,
      user: user ? { id: user.id, username: user.username } : null,
    });
  } catch (e) {
    console.error('Verify code error:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

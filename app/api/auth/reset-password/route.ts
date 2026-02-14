import { NextResponse } from 'next/server';
import { emailExists, hashPassword, updatePasswordByEmail } from '../lib/users-store';
import { consumeVerificationCode } from '../lib/verification-codes-store';
import { rateLimitResponse } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** שחזור סיסמה: אימייל + קוד אימות + סיסמה חדשה */
export async function POST(request: Request) {
  const rateLimited = rateLimitResponse(request, LIMITS.AUTH);
  if (rateLimited) return rateLimited;
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: 'כתובת אימייל לא תקינה' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: 'הקוד חייב להכיל 6 ספרות' }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ ok: false, error: 'הסיסמה חייבת להכיל לפחות 4 תווים' }, { status: 400 });
    }

    if (!(await emailExists(email))) {
      return NextResponse.json({ ok: false, error: 'לא נמצא משתמש עם אימייל זה' }, { status: 404 });
    }

    const valid = await consumeVerificationCode(email, code);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'קוד לא תקין או שפג תוקפו' }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    const updated = await updatePasswordByEmail(email, newHash);
    if (!updated) {
      return NextResponse.json({ ok: false, error: 'שגיאה בעדכון הסיסמה' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'הסיסמה עודכנה' });
  } catch (e) {
    console.error('Reset password error:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

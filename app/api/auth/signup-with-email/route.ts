import { NextResponse } from 'next/server';
import { emailExists, usernameExists, hashPassword, generateId, createUser } from '../lib/users-store';
import { consumeVerificationCode } from '../lib/verification-codes-store';
import { sendNewUserNotificationEmail } from '../lib/send-email';
import { createSessionToken, setSessionCookie } from '../../../../lib/auth-server';
import { rateLimitResponse } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** הרשמה אחרי אימות אימייל: קוד + שם משתמש + סיסמה */
export async function POST(request: Request) {
  const rateLimited = rateLimitResponse(request, LIMITS.AUTH);
  if (rateLimited) return rateLimited;
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: 'כתובת אימייל לא תקינה' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: 'הקוד חייב להכיל 6 ספרות' }, { status: 400 });
    }
    if (!username || username.length < 2) {
      return NextResponse.json({ ok: false, error: 'שם המשתמש חייב להכיל לפחות 2 תווים' }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ ok: false, error: 'הסיסמה חייבת להכיל לפחות 4 תווים' }, { status: 400 });
    }

    const valid = await consumeVerificationCode(email, code);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'קוד לא תקין או שפג תוקפו' }, { status: 401 });
    }

    if (await emailExists(email)) {
      return NextResponse.json({ ok: false, error: 'כתובת המייל כבר רשומה במערכת' }, { status: 400 });
    }
    if (await usernameExists(username)) {
      return NextResponse.json({ ok: false, error: 'שם המשתמש כבר תפוס' }, { status: 400 });
    }

    const newUser = {
      id: generateId(),
      username,
      email,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    const created = await createUser(newUser);
    if (!created) {
      return NextResponse.json({ ok: false, error: 'שגיאה בשמירת המשתמש' }, { status: 500 });
    }

    const notifyEmails: string[] = [];
    const adminNotify = process.env.NOTIFY_ADMIN_EMAIL?.trim();
    const smsNotify = process.env.NOTIFY_SMS_EMAIL?.trim();
    if (adminNotify) notifyEmails.push(adminNotify);
    if (smsNotify) notifyEmails.push(smsNotify);
    if (notifyEmails.length === 0) {
      const fallback = process.env.EMAIL_USER?.trim() || 'quotes.verify1@gmail.com';
      notifyEmails.push(fallback);
    }
    try {
      await sendNewUserNotificationEmail(notifyEmails, {
        email: newUser.email!,
        username: newUser.username,
        createdAt: newUser.createdAt,
      });
    } catch (e) {
      console.warn('Failed to send admin notification email:', e);
    }

    const token = await createSessionToken({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    });
    const response = NextResponse.json({
      ok: true,
      user: { id: newUser.id, username: newUser.username, email: newUser.email },
    });
    setSessionCookie(response, token);
    return response;
  } catch (e) {
    console.error('Signup with email error:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

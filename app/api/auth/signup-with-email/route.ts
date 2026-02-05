import { NextResponse } from 'next/server';
import { readUsers, writeUsers, hashPassword, generateId, type StoredUser } from '../lib/users-store';
import { consumeVerificationCode } from '../lib/verification-codes-store';
import { sendNewUserNotificationEmail } from '../lib/send-email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** הרשמה אחרי אימות אימייל: קוד + שם משתמש + סיסמה */
export async function POST(request: Request) {
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

    const users = await readUsers();
    if (users.some((u) => u.email?.toLowerCase() === email)) {
      return NextResponse.json({ ok: false, error: 'כתובת המייל כבר רשומה במערכת' }, { status: 400 });
    }
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json({ ok: false, error: 'שם המשתמש כבר תפוס' }, { status: 400 });
    }

    const newUser: StoredUser = {
      id: generateId(),
      username,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    await writeUsers(users);

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

    return NextResponse.json({
      ok: true,
      user: { id: newUser.id, username: newUser.username, email: newUser.email },
    });
  } catch (e) {
    console.error('Signup with email error:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

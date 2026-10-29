import { NextResponse } from 'next/server';
import { usernameExists, hashPassword, generateId, createUser } from '../lib/users-store';
import { getAdminNotifyRecipients, sendNewUserNotificationEmail } from '../lib/send-email';
import { createSessionToken, setSessionCookie, clearImpersonationCookies } from '../../../../lib/auth-server';
import { rateLimitResponse } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';
import { PASSWORD_TOO_SHORT_MESSAGE, isPasswordTooShort } from '../../../../lib/password-policy';

export async function POST(request: Request) {
  const rateLimited = await rateLimitResponse(request, LIMITS.AUTH);
  if (rateLimited) return rateLimited;
  try {
    const body = await request.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username) {
      return NextResponse.json({ ok: false, error: 'נא להזין שם משתמש' }, { status: 400 });
    }
    if (username.length < 2) {
      return NextResponse.json({ ok: false, error: 'שם המשתמש חייב להכיל לפחות 2 תווים' }, { status: 400 });
    }
    if (!password || isPasswordTooShort(password)) {
      return NextResponse.json({ ok: false, error: PASSWORD_TOO_SHORT_MESSAGE }, { status: 400 });
    }

    if (await usernameExists(username)) {
      return NextResponse.json({ ok: false, error: 'שם המשתמש כבר תפוס' }, { status: 400 });
    }

    const newUser = {
      id: generateId(),
      username,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    const created = await createUser(newUser);
    if (!created) {
      return NextResponse.json({ ok: false, error: 'שגיאה בשמירת המשתמש' }, { status: 500 });
    }

    try {
      await sendNewUserNotificationEmail(getAdminNotifyRecipients(), {
        email: '—',
        username: newUser.username,
        createdAt: newUser.createdAt,
      });
    } catch (e) {
      console.warn('Failed to send admin notification email:', e);
    }

    const token = await createSessionToken({
      id: newUser.id,
      username: newUser.username,
    });
    const response = NextResponse.json({
      ok: true,
      user: { id: newUser.id, username: newUser.username },
    });
    setSessionCookie(response, token);
    clearImpersonationCookies(response);
    return response;
  } catch (e) {
    console.error('Signup error:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

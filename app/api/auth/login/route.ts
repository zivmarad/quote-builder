import { NextResponse } from 'next/server';
import { getUserByLogin, verifyPassword, rehashToBcryptIfNeeded } from '../lib/users-store';
import { createSessionToken, setSessionCookie } from '../../../../lib/auth-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = typeof body.username === 'string' ? body.username.trim() : (typeof body.login === 'string' ? body.login.trim() : '');
    const password = typeof body.password === 'string' ? body.password : '';

    if (!login || !password) {
      return NextResponse.json({ ok: false, error: 'נא למלא שם משתמש או אימייל וסיסמה' }, { status: 400 });
    }

    const found = await getUserByLogin(login);
    if (!found) {
      return NextResponse.json({ ok: false, error: 'שם משתמש/אימייל או סיסמה שגויים' }, { status: 401 });
    }

    const valid = await verifyPassword(password, found.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'שם משתמש/אימייל או סיסמה שגויים' }, { status: 401 });
    }

    await rehashToBcryptIfNeeded(found.id, password, found.passwordHash);

    const token = await createSessionToken({
      id: found.id,
      username: found.username,
      email: found.email,
    });
    const response = NextResponse.json({
      ok: true,
      user: { id: found.id, username: found.username, email: found.email },
    });
    setSessionCookie(response, token);
    return response;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

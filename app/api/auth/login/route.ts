import { NextResponse } from 'next/server';
import { getUserByLogin, verifyPassword, rehashToBcryptIfNeeded } from '../lib/users-store';
import { createSessionToken, setSessionCookie, clearImpersonationCookies } from '../../../../lib/auth-server';
import { rateLimitResponse, withRequestId } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';
import { getRequestLogMeta, logError, logWarn } from '../../../../lib/observability';

export async function POST(request: Request) {
  const meta = getRequestLogMeta(request);
  const json = (body: unknown, init?: ResponseInit) => withRequestId(NextResponse.json(body, init), meta.requestId);
  const rateLimited = await rateLimitResponse(request, LIMITS.AUTH);
  if (rateLimited) return rateLimited;
  try {
    const body = await request.json();
    const login = typeof body.username === 'string' ? body.username.trim() : (typeof body.login === 'string' ? body.login.trim() : '');
    const password = typeof body.password === 'string' ? body.password : '';

    if (!login || !password) {
      logWarn('Auth login bad request', { ...meta });
      return json({ ok: false, error: 'נא למלא שם משתמש או אימייל וסיסמה' }, { status: 400 });
    }

    const found = await getUserByLogin(login);
    if (!found) {
      logWarn('Auth login user not found', { ...meta, login });
      return json({ ok: false, error: 'שם משתמש/אימייל או סיסמה שגויים' }, { status: 401 });
    }

    const valid = await verifyPassword(password, found.passwordHash);
    if (!valid) {
      logWarn('Auth login invalid password', { ...meta, userId: found.id });
      return json({ ok: false, error: 'שם משתמש/אימייל או סיסמה שגויים' }, { status: 401 });
    }

    await rehashToBcryptIfNeeded(found.id, password, found.passwordHash);

    const token = await createSessionToken({
      id: found.id,
      username: found.username,
      email: found.email,
    });
    const response = json({
      ok: true,
      user: { id: found.id, username: found.username, email: found.email },
    });
    setSessionCookie(response, token);
    clearImpersonationCookies(response);
    return response;
  } catch (e) {
    logError('Auth login exception', { ...meta, error: e instanceof Error ? e.message : String(e) });
    return json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

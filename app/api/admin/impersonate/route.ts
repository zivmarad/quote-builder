import { NextResponse } from 'next/server';
import { getAdminKeyFromRequest } from '../../../../lib/admin-config';
import { getUserById } from '../../auth/lib/users-store';
import {
  createSessionToken,
  setSessionCookie,
  setPrevSessionCookie,
  setImpersonationMarkerCookie,
  getTokenFromRequest,
} from '../../../../lib/auth-server';
import { rateLimitResponse } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';

/** מנהל (X-Admin-Key) מקבל סשן של המשתמש הנבחר – כמו התחברות מלאה */
export async function POST(request: Request) {
  if (!getAdminKeyFromRequest(request)) {
    return NextResponse.json({ ok: false, error: 'לא מורשה' }, { status: 401 });
  }
  const rateLimited = rateLimitResponse(request, LIMITS.ADMIN_IMPERSONATE);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'חסר userId' }, { status: 400 });
    }

    const target = await getUserById(userId);
    if (!target) {
      return NextResponse.json({ ok: false, error: 'משתמש לא נמצא' }, { status: 404 });
    }

    const currentToken = getTokenFromRequest(request);
    const response = NextResponse.json({
      ok: true,
      user: { id: target.id, username: target.username, email: target.email ?? undefined },
    });

    if (currentToken) {
      setPrevSessionCookie(response, currentToken);
    }
    const token = await createSessionToken({
      id: target.id,
      username: target.username,
      email: target.email,
    });
    setSessionCookie(response, token);
    setImpersonationMarkerCookie(response);
    return response;
  } catch (e) {
    console.error('Admin impersonate:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

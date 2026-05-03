import { NextResponse } from 'next/server';
import {
  isImpersonationActive,
  getPrevSessionTokenFromRequest,
  setSessionCookie,
  clearSessionCookie,
  clearImpersonationCookies,
} from '../../../../lib/auth-server';

/** יציאה ממצב "צפה כמשתמש" – שחזור סשן קודם או התנתקות */
export async function POST(request: Request) {
  if (!isImpersonationActive(request)) {
    return NextResponse.json({ ok: false, error: 'לא במצב התחזות' }, { status: 400 });
  }

  const prev = getPrevSessionTokenFromRequest(request);
  const response = NextResponse.json({ ok: true });

  if (prev) {
    setSessionCookie(response, prev);
  } else {
    clearSessionCookie(response);
  }
  clearImpersonationCookies(response);
  return response;
}

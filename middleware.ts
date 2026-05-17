import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'quoteBuilder_session';
const GUEST_HOME_COOKIE = 'quoteBuilder_guestHome';

/** אורח בדף הבית → דף נחיתה. deep links, "נסה בלי הרשמה" (?try=1) ומשתמשים מחוברים לא מושפעים. */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== '/') return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value?.trim();
  if (token) return NextResponse.next();

  const tryGuest = request.nextUrl.searchParams.get('try') === '1';
  const guestHome = request.cookies.get(GUEST_HOME_COOKIE)?.value === '1';
  if (guestHome) return NextResponse.next();

  if (tryGuest) {
    const res = NextResponse.next();
    res.cookies.set(GUEST_HOME_COOKIE, '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return res;
  }

  return NextResponse.redirect(new URL('/landing', request.url), 302);
}

export const config = {
  matcher: ['/'],
};

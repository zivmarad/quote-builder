import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'quoteBuilder_session';

/** אורח בדף הבית → דף נחיתה. deep links ומשתמשים מחוברים לא מושפעים. */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== '/') return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value?.trim();
  if (token) return NextResponse.next();

  return NextResponse.redirect(new URL('/landing', request.url), 302);
}

export const config = {
  matcher: ['/'],
};

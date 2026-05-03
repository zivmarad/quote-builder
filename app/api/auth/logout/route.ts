import { NextResponse } from 'next/server';
import { clearSessionCookie, clearImpersonationCookies } from '../../../../lib/auth-server';

/** מוחק את cookie הסשן (יציאה). */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  clearImpersonationCookies(response);
  return response;
}

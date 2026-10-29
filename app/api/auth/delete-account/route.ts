import { NextResponse } from 'next/server';
import { deleteUserById } from '../lib/users-store';
import { clearImpersonationCookies, clearSessionCookie, getCurrentUser, isImpersonationActive } from '../../../../lib/auth-server';
import { rateLimitResponse } from '../../../../lib/api-helpers';
import { LIMITS } from '../../../../lib/rate-limit';

/** מחיקת החשבון של המשתמש המחובר, כולל הנתונים בענן. */
export async function POST(request: Request) {
  const rateLimited = await rateLimitResponse(request, LIMITS.AUTH);
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
  }
  if (isImpersonationActive(request)) {
    return NextResponse.json({ ok: false, error: 'אי אפשר למחוק חשבון מתוך צפייה של מנהל' }, { status: 403 });
  }

  let body: { username?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!username || username !== user.username) {
    return NextResponse.json({ ok: false, error: 'יש להקליד את שם המשתמש כדי לאשר' }, { status: 400 });
  }

  const deleted = await deleteUserById(user.id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: 'מחיקת החשבון נכשלה. נסה שוב או פנה דרך צור קשר.' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  clearImpersonationCookies(response);
  return response;
}

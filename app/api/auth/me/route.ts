import { NextResponse } from 'next/server';
import { getCurrentUser, isImpersonationActive } from '../../../../lib/auth-server';

/** מחזיר את המשתמש המחובר לפי ה-cookie (JWT). לשימוש ב-client בעת טעינת האפליקציה. */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const impersonating = isImpersonationActive(request);
    if (!user) {
      return NextResponse.json({ ok: false, user: null, impersonating: false }, { status: 401 });
    }
    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username, email: user.email },
      impersonating,
    });
  } catch (e) {
    console.error('Auth me error:', e);
    return NextResponse.json({ ok: false, user: null, impersonating: false }, { status: 500 });
  }
}

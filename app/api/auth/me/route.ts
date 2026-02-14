import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth-server';

/** מחזיר את המשתמש המחובר לפי ה-cookie (JWT). לשימוש ב-client בעת טעינת האפליקציה. */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }
    return NextResponse.json({ ok: true, user: { id: user.id, username: user.username, email: user.email } });
  } catch (e) {
    console.error('Auth me error:', e);
    return NextResponse.json({ ok: false, user: null }, { status: 500 });
  }
}

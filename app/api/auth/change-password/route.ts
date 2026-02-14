import { NextResponse } from 'next/server';
import { getUserById, verifyPassword, hashPassword, updatePasswordHash } from '../lib/users-store';
import { getCurrentUser } from '../../../../lib/auth-server';

/** שינוי סיסמה כשמחובר – דורש סיסמה נוכחית. המשתמש נקבע לפי ה-JWT. */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'נא להתחבר' }, { status: 401 });
    }
    const body = await request.json();
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ ok: false, error: 'נא למלא סיסמה נוכחית וסיסמה חדשה' }, { status: 400 });
    }
    if (newPassword.length < 4) {
      return NextResponse.json({ ok: false, error: 'הסיסמה החדשה חייבת להכיל לפחות 4 תווים' }, { status: 400 });
    }

    const stored = await getUserById(user.id);
    if (!stored) {
      return NextResponse.json({ ok: false, error: 'משתמש לא נמצא' }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, stored.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'הסיסמה הנוכחית שגויה' }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    const updated = await updatePasswordHash(user.id, newHash);
    if (!updated) {
      return NextResponse.json({ ok: false, error: 'שגיאה בעדכון הסיסמה' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'הסיסמה עודכנה' });
  } catch (e) {
    console.error('Change password error:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

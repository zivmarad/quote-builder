import { NextResponse } from 'next/server';
import { readUsers, writeUsers, hashPassword } from '../lib/users-store';

/** שינוי סיסמה כשמחובר – דורש סיסמה נוכחית */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ ok: false, error: 'נא למלא סיסמה נוכחית וסיסמה חדשה' }, { status: 400 });
    }
    if (newPassword.length < 4) {
      return NextResponse.json({ ok: false, error: 'הסיסמה החדשה חייבת להכיל לפחות 4 תווים' }, { status: 400 });
    }

    const users = await readUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      return NextResponse.json({ ok: false, error: 'משתמש לא נמצא' }, { status: 404 });
    }

    const currentHash = hashPassword(currentPassword);
    if (currentHash !== users[idx].passwordHash) {
      return NextResponse.json({ ok: false, error: 'הסיסמה הנוכחית שגויה' }, { status: 401 });
    }

    users[idx] = { ...users[idx], passwordHash: hashPassword(newPassword) };
    await writeUsers(users);

    return NextResponse.json({ ok: true, message: 'הסיסמה עודכנה' });
  } catch (e) {
    console.error('Change password error:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

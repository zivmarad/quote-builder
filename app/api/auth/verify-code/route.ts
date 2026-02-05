import { NextResponse } from 'next/server';
import { readUsers, writeUsers, generateId } from '../lib/users-store';
import { consumeVerificationCode } from '../lib/verification-codes-store';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: 'כתובת אימייל לא תקינה' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: 'הקוד חייב להכיל 6 ספרות' }, { status: 400 });
    }

    const valid = await consumeVerificationCode(email, code);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'קוד לא תקין או שפג תוקפו' }, { status: 401 });
    }

    const users = await readUsers();
    let user = users.find((u) => u.email?.toLowerCase() === email);

    if (!user) {
      const displayName = email.split('@')[0];
      user = {
        id: generateId(),
        username: displayName,
        email,
        passwordHash: '',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      await writeUsers(users);
    }

    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username },
    });
  } catch (e) {
    console.error('Verify code error:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

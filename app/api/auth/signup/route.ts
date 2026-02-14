import { NextResponse } from 'next/server';
import { readUsers, writeUsers, hashPassword, generateId, type StoredUser } from '../lib/users-store';
import { createSessionToken, setSessionCookie } from '../../../../lib/auth-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username) {
      return NextResponse.json({ ok: false, error: 'נא להזין שם משתמש' }, { status: 400 });
    }
    if (username.length < 2) {
      return NextResponse.json({ ok: false, error: 'שם המשתמש חייב להכיל לפחות 2 תווים' }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ ok: false, error: 'הסיסמה חייבת להכיל לפחות 4 תווים' }, { status: 400 });
    }

    const users = await readUsers();
    const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return NextResponse.json({ ok: false, error: 'שם המשתמש כבר תפוס' }, { status: 400 });
    }

    const newUser: StoredUser = {
      id: generateId(),
      username,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    await writeUsers(users);

    const token = await createSessionToken({
      id: newUser.id,
      username: newUser.username,
    });
    const response = NextResponse.json({
      ok: true,
      user: { id: newUser.id, username: newUser.username },
    });
    setSessionCookie(response, token);
    return response;
  } catch (e) {
    console.error('Signup error:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

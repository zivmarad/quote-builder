import { NextResponse } from 'next/server';
import { readUsers } from '../lib/users-store';
import { sendUsernameToEmail } from '../lib/send-email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** שולח את שם המשתמש למייל – רק אם יש משתמש עם האימייל (לא מחשף אם אין) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: 'כתובת אימייל לא תקינה' }, { status: 400 });
    }

    const users = await readUsers();
    const user = users.find((u) => u.email?.toLowerCase() === email);
    if (user) {
      try {
        await sendUsernameToEmail(email, user.username);
      } catch (e) {
        console.error('Send username email error:', e);
        return NextResponse.json({ ok: false, error: 'לא ניתן לשלוח מייל' }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, message: 'אם האימייל רשום במערכת, תקבל את שם המשתמש למייל' });
  } catch (e) {
    console.error('Send username error:', e);
    return NextResponse.json({ ok: false, error: 'שגיאה בשרת' }, { status: 500 });
  }
}

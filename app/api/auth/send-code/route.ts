import { NextResponse } from 'next/server';
import { saveVerificationCode, generateSixDigitCode } from '../lib/verification-codes-store';
import { sendVerificationEmail } from '../lib/send-email';
import { emailExists } from '../lib/users-store';
import { isSupabaseConfigured } from '../../../../lib/supabase-server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const intent = body.intent === 'reset' ? 'reset' : 'signup';

    if (!email) {
      return NextResponse.json({ ok: false, error: 'נא להזין כתובת אימייל' }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: 'כתובת האימייל אינה תקינה' }, { status: 400 });
    }

    const emailRegistered = await emailExists(email);

    if (intent === 'signup') {
      if (emailRegistered) {
        return NextResponse.json(
          { ok: false, error: 'כתובת המייל כבר רשומה במערכת. התחבר עם שם המשתמש והסיסמה שבחרת.' },
          { status: 400 }
        );
      }
    } else {
      if (!emailRegistered) {
        return NextResponse.json({ ok: true, message: 'אם האימייל רשום במערכת, תקבל קוד למייל' });
      }
    }

    if (!isSupabaseConfigured) {
      console.error('send-code: Supabase not configured – cannot save verification codes. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
      return NextResponse.json(
        {
          ok: false,
          error: 'שליחת קוד אימות אינה זמינה כרגע. נסה שוב מאוחר יותר או צור קשר עם התמיכה.',
        },
        { status: 503 }
      );
    }

    const code = generateSixDigitCode();
    const saved = await saveVerificationCode(email, code, 10);
    if (!saved) {
      console.error('send-code: Failed to save verification code to Supabase (table missing or permission error?)');
      return NextResponse.json(
        {
          ok: false,
          error: 'שליחת קוד אימות אינה זמינה כרגע. נסה שוב מאוחר יותר או צור קשר עם התמיכה.',
        },
        { status: 503 }
      );
    }

    await sendVerificationEmail(email, code);

    return NextResponse.json({ ok: true, message: 'קוד אימות נשלח למייל' });
  } catch (e) {
    const err = e instanceof Error ? e : new Error('שגיאה בשרת');
    const msg = err.message;
    console.error('Send code error:', e);
    if (msg.includes('EMAIL_APP_PASSWORD') || !process.env.EMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { ok: false, error: 'שליחת מייל לא מוגדרת. יש להגדיר EMAIL_APP_PASSWORD ב-.env.local' },
        { status: 503 }
      );
    }
    const isDev = process.env.NODE_ENV === 'development';
    const detail = (e as { response?: { message?: string } }).response?.message ?? msg;
    return NextResponse.json(
      { ok: false, error: isDev ? `שליחת מייל נכשלה: ${detail}` : 'לא ניתן לשלוח מייל. נסה שוב מאוחר יותר.' },
      { status: 500 }
    );
  }
}

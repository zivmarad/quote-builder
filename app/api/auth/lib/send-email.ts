import { Resend } from 'resend';

/** כתובת שולח רשמית מהדומיין המאומת ב-Resend. ניתן לעקוף עם EMAIL_FROM. */
function getFromHeader(): string {
  const custom = process.env.EMAIL_FROM?.trim();
  if (custom) return custom;
  return 'בונה הצעות מחיר <noreply@hatzaot.co.il>';
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('RESEND_API_KEY לא מוגדר ב-.env');
  return new Resend(apiKey);
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: getFromHeader(),
    to,
    subject: `קוד אימות: ${code} – בונה הצעות מחיר`,
    text: `קוד האימות שלך: ${code}\n\nהקוד תקף ל־10 דקות.\nאם לא ביקשת קוד זה, התעלם מהמייל.`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 400px;">
        <h2>קוד אימות</h2>
        <p>קוד האימות שלך:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p style="color: #666;">הקוד תקף ל־10 דקות.</p>
        <p style="color: #999; font-size: 12px;">אם לא ביקשת קוד זה, התעלם מהמייל.</p>
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}

/** שליחת שם המשתמש למייל (שכחתי שם משתמש) */
export async function sendUsernameToEmail(to: string, username: string): Promise<void> {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: getFromHeader(),
    to,
    subject: 'שם המשתמש שלך – בונה הצעות מחיר',
    text: `שלום,\n\nשם המשתמש שלך: ${username}\n\nאם לא ביקשת מידע זה, התעלם מהמייל.`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 400px;">
        <h2>שם המשתמש שלך</h2>
        <p>שם המשתמש בחשבון:</p>
        <p style="font-size: 20px; font-weight: bold;">${username}</p>
        <p style="color: #999; font-size: 12px;">אם לא ביקשת מידע זה, התעלם מהמייל.</p>
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}

/** מייל לאדמין על הרשמה חדשה – מקבל כתובת אחת או מערך (למשל מייל פרטי + אימייל-ל-SMS) */
export async function sendNewUserNotificationEmail(
  to: string | string[],
  data: { email: string; username: string; createdAt: string }
): Promise<void> {
  const toList = Array.isArray(to) ? to : [to];
  if (toList.length === 0) return;
  const resend = getResend();
  const dateStr = new Date(data.createdAt).toLocaleString('he-IL');
  const { error } = await resend.emails.send({
    from: getFromHeader(),
    to: toList,
    subject: 'הרשמה חדשה – בונה הצעות מחיר',
    text: `נרשם משתמש חדש.\nאימייל: ${data.email}\nשם משתמש: ${data.username}\nתאריך: ${dateStr}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 400px;">
        <h2>הרשמה חדשה</h2>
        <p><strong>אימייל:</strong> ${data.email}</p>
        <p><strong>שם משתמש:</strong> ${data.username}</p>
        <p><strong>תאריך:</strong> ${dateStr}</p>
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}

import nodemailer from 'nodemailer';

function getFromEmail(): string {
  const email = process.env.EMAIL_USER?.trim();
  if (!email) throw new Error('EMAIL_USER לא מוגדר ב-.env');
  return email;
}

function getTransporter() {
  const fromEmail = getFromEmail();
  const raw = process.env.EMAIL_APP_PASSWORD?.trim() ?? '';
  const appPassword = raw.replace(/\s/g, '');
  if (!appPassword) throw new Error('EMAIL_APP_PASSWORD לא מוגדר ב-.env');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: fromEmail, pass: appPassword },
  });
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const transporter = getTransporter();
  const fromEmail = getFromEmail();
  await transporter.sendMail({
    from: `בונה הצעות מחיר <${fromEmail}>`,
    to,
    subject: 'קוד אימות – בונה הצעות מחיר',
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
}

/** שליחת שם המשתמש למייל (שכחתי שם משתמש) */
export async function sendUsernameToEmail(to: string, username: string): Promise<void> {
  const transporter = getTransporter();
  const fromEmail = getFromEmail();
  await transporter.sendMail({
    from: `בונה הצעות מחיר <${fromEmail}>`,
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
}

/** מייל לאדמין על הרשמה חדשה – מקבל כתובת אחת או מערך (למשל מייל פרטי + אימייל-ל-SMS) */
export async function sendNewUserNotificationEmail(
  to: string | string[],
  data: { email: string; username: string; createdAt: string }
): Promise<void> {
  const transporter = getTransporter();
  const fromEmail = getFromEmail();
  const dateStr = new Date(data.createdAt).toLocaleString('he-IL');
  const toList = Array.isArray(to) ? to : [to];
  if (toList.length === 0) return;
  await transporter.sendMail({
    from: `בונה הצעות מחיר <${fromEmail}>`,
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
}

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

export type CustomProfessionNotifyPayload = {
  userId: string;
  username: string;
  email: string | null;
  categoryId: string;
  categoryName: string;
  icon: string;
  services: Array<{
    name: string;
    basePrice: number;
    unit: string;
    isCounter: boolean;
    questions: Array<{ text: string; impactType: string; impactValue: number }>;
  }>;
  createdAt: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** מייל לאדמין על מקצוע מותאם חדש שמשתמש יצר */
export async function sendCustomProfessionNotificationEmail(
  to: string | string[],
  data: CustomProfessionNotifyPayload
): Promise<void> {
  const toList = Array.isArray(to) ? to : [to];
  if (toList.length === 0) return;
  const resend = getResend();
  const dateStr = new Date(data.createdAt).toLocaleString('he-IL');
  const servicesText =
    data.services.length === 0
      ? '(עדיין ללא שירותים)'
      : data.services
          .map((s, i) => {
            const qs =
              s.questions.length === 0
                ? '    ללא שאלות'
                : s.questions
                    .map((q) => `    • ${q.text} (${q.impactType}: ${q.impactValue})`)
                    .join('\n');
            return `${i + 1}. ${s.name} — ${s.basePrice} ₪ / ${s.unit}${s.isCounter ? ' (כמות)' : ''}\n${qs}`;
          })
          .join('\n\n');

  const servicesHtml =
    data.services.length === 0
      ? '<p style="color:#666;">עדיין ללא שירותים</p>'
      : `<ol style="padding-right:20px;">${data.services
          .map((s) => {
            const qs =
              s.questions.length === 0
                ? '<li style="color:#888;">ללא שאלות</li>'
                : s.questions
                    .map(
                      (q) =>
                        `<li>${escapeHtml(q.text)} <span style="color:#666;">(${escapeHtml(q.impactType)}: ${q.impactValue})</span></li>`
                    )
                    .join('');
            return `<li style="margin-bottom:12px;"><strong>${escapeHtml(s.name)}</strong> — ${s.basePrice} ₪ / ${escapeHtml(s.unit)}${s.isCounter ? ' (כמות)' : ''}<ul style="margin:6px 0 0;padding-right:18px;">${qs}</ul></li>`;
          })
          .join('')}</ol>`;

  const { error } = await resend.emails.send({
    from: getFromHeader(),
    to: toList,
    subject: `מקצוע חדש: ${data.categoryName} – בונה הצעות מחיר`,
    text: [
      'נוסף מקצוע מותאם חדש.',
      '',
      `מקצוע: ${data.icon} ${data.categoryName}`,
      `מזהה: ${data.categoryId}`,
      `משתמש: ${data.username}`,
      `אימייל: ${data.email ?? '—'}`,
      `מזהה משתמש: ${data.userId}`,
      `תאריך: ${dateStr}`,
      '',
      'שירותים:',
      servicesText,
    ].join('\n'),
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 560px; color:#0f172a;">
        <h2 style="margin:0 0 12px;">מקצוע מותאם חדש</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
          <tr><td style="padding:6px 0;color:#64748b;">מקצוע</td><td style="padding:6px 0;font-weight:bold;">${escapeHtml(data.icon)} ${escapeHtml(data.categoryName)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">משתמש</td><td style="padding:6px 0;">${escapeHtml(data.username)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">אימייל</td><td style="padding:6px 0;">${escapeHtml(data.email ?? '—')}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">תאריך</td><td style="padding:6px 0;">${escapeHtml(dateStr)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">מזהה מקצוע</td><td style="padding:6px 0;font-size:12px;color:#64748b;">${escapeHtml(data.categoryId)}</td></tr>
        </table>
        <h3 style="margin:0 0 8px;font-size:16px;">שירותים (${data.services.length})</h3>
        ${servicesHtml}
      </div>
    `,
  });
  if (error) throw new Error(error.message);
}

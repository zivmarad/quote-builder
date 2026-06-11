/**
 * הורדת תבנית הצעת מחיר כקובץ Word (.doc).
 * מוגש כ-HTML עם MIME של Word – נפתח ב-Microsoft Word / Google Docs לעריכה.
 * נועד לכוונת החיפוש "הצעת מחיר וורד / טופס הצעת מחיר להורדה".
 */
export const dynamic = 'force-static';

const TEMPLATE_HTML = `\uFEFF<!DOCTYPE html>
<html lang="he" dir="rtl" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8" />
<title>הצעת מחיר</title>
<style>
  body { font-family: Arial, sans-serif; direction: rtl; color: #1f2937; font-size: 12pt; }
  h1 { font-size: 22pt; margin: 0 0 4pt; }
  .muted { color: #6b7280; font-size: 10pt; }
  .row { display: block; margin: 2pt 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 14pt; }
  th, td { border: 1px solid #d1d5db; padding: 6pt 8pt; text-align: right; font-size: 11pt; }
  th { background: #f3f4f6; }
  .totals td { border: none; padding: 3pt 8pt; }
  .total-final { font-weight: bold; font-size: 13pt; }
  .section-title { font-weight: bold; margin-top: 16pt; font-size: 13pt; }
  hr { border: none; border-top: 2px solid #2563eb; margin: 10pt 0; }
</style>
</head>
<body>
  <h1>הצעת מחיר</h1>
  <div class="muted">מס' הצעה: ______ &nbsp;|&nbsp; תאריך: ____ / ____ / ______</div>
  <hr />

  <div class="section-title">פרטי העסק</div>
  <div class="row">שם העסק: ____________________________</div>
  <div class="row">איש קשר: ____________________________</div>
  <div class="row">טלפון: ______________  אימייל: ______________________</div>
  <div class="row">ח.פ / ע.מ: ______________  כתובת: ______________________</div>

  <div class="section-title">פרטי הלקוח</div>
  <div class="row">שם הלקוח: ____________________________</div>
  <div class="row">טלפון: ______________  כתובת האתר: ______________________</div>

  <table>
    <thead>
      <tr>
        <th style="width:6%">#</th>
        <th>תיאור העבודה</th>
        <th style="width:12%">כמות</th>
        <th style="width:18%">מחיר ליחידה (₪)</th>
        <th style="width:18%">סה"כ (₪)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>2</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>3</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>4</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>5</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    </tbody>
  </table>

  <table class="totals" style="width:50%; margin-right:auto; margin-top:10pt;">
    <tr><td>סכום ביניים:</td><td>______________ ₪</td></tr>
    <tr><td>מע"מ (18%):</td><td>______________ ₪</td></tr>
    <tr class="total-final"><td>סה"כ לתשלום:</td><td>______________ ₪</td></tr>
  </table>

  <div class="section-title">תנאים</div>
  <div class="row">תנאי תשלום: ____________________________</div>
  <div class="row">לוח זמנים: ____________________________</div>
  <div class="row">תוקף ההצעה: ______ ימים מתאריך ההנפקה.</div>
  <div class="row">סעיף חריגות: ייתכנו תוספות של עד כ-5% בגין עבודות בלתי צפויות שיתגלו בשטח.</div>

  <div style="margin-top:24pt;">חתימת בעל המקצוע: ________________ &nbsp;&nbsp; אישור הלקוח: ________________</div>

  <div class="muted" style="margin-top:20pt;">
    תבנית חינמית מבית בונה הצעות המחיר – hatzaot.co.il. לבניית הצעה אוטומטית עם מחירון מובנה ו-PDF ממותג, היכנסו לאתר.
  </div>
</body>
</html>`;

export function GET() {
  return new Response(TEMPLATE_HTML, {
    headers: {
      'Content-Type': 'application/msword; charset=utf-8',
      'Content-Disposition': 'attachment; filename="price-quote-template.doc"',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

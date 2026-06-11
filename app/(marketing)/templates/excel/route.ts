/**
 * הורדת תבנית הצעת מחיר כקובץ CSV (נפתח ב-Excel / Google Sheets).
 * כולל BOM כדי שעברית תוצג נכון ב-Excel, ושורות לדוגמה למילוי.
 * נועד לכוונת החיפוש "טופס הצעת מחיר אקסל / להורדה".
 */
export const dynamic = 'force-static';

const rows: string[][] = [
  ['הצעת מחיר'],
  ['מס\' הצעה:', '', 'תאריך:', ''],
  [],
  ['פרטי העסק'],
  ['שם העסק:', '', 'טלפון:', ''],
  ['ח.פ / ע.מ:', '', 'אימייל:', ''],
  [],
  ['פרטי הלקוח'],
  ['שם הלקוח:', '', 'כתובת האתר:', ''],
  [],
  ['#', 'תיאור העבודה', 'כמות', 'מחיר ליחידה', 'סה"כ'],
  ['1', '', '', '', ''],
  ['2', '', '', '', ''],
  ['3', '', '', '', ''],
  ['4', '', '', '', ''],
  ['5', '', '', '', ''],
  [],
  ['', '', '', 'סכום ביניים:', ''],
  ['', '', '', 'מע"מ (18%):', ''],
  ['', '', '', 'סה"כ לתשלום:', ''],
  [],
  ['תנאי תשלום:', ''],
  ['תוקף ההצעה (ימים):', ''],
  [],
  ['תבנית חינמית מבית בונה הצעות המחיר – hatzaot.co.il'],
];

const escapeCell = (cell: string) => {
  if (/[",\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
};

const csv = '\uFEFF' + rows.map((r) => r.map(escapeCell).join(',')).join('\r\n');

export function GET() {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="price-quote-template.csv"',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

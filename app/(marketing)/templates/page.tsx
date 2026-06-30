import Link from 'next/link';
import type { Metadata } from 'next';
import { FileText, FileSpreadsheet, Printer, ArrowLeft } from 'lucide-react';
import { withSiteMetadata } from '@/lib/site-metadata';
import { absoluteUrl } from '@/lib/site-url';
import {
  Breadcrumbs,
  SeoFaqList,
  SeoCta,
  JsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from '../_seo/SeoComponents';

export const metadata: Metadata = withSiteMetadata('/templates', {
  title: 'טופס הצעת מחיר להורדה חינם – Word, Excel ו-PDF',
  description:
    'הורד טופס הצעת מחיר חינם: תבנית Word לעריכה, תבנית Excel/CSV לחישוב, וגרסת PDF להדפסה. או בנה הצעת מחיר חכמה וממותגת ב-60 שניות עם מחירון מובנה.',
});

const faq = [
  {
    question: 'איך מורידים טופס הצעת מחיר חינם?',
    answer:
      'בעמוד זה אפשר להוריד תבנית הצעת מחיר ב-Word (לעריכה), ב-Excel/CSV (לחישוב), וגרסת PDF להדפסה – הכל בחינם וללא הרשמה. לחיצה על כל כפתור מורידה את הקובץ למכשיר.',
  },
  {
    question: 'מה עדיף – תבנית להורדה או כלי אוטומטי?',
    answer:
      'תבנית סטטית טובה למילוי ידני חד-פעמי. אם אתה שולח הצעות מחיר באופן קבוע, כלי שמחשב סכומים ומע"מ אוטומטית, עם מחירון מובנה ומיתוג, חוסך זמן ומונע טעויות – וזה גם חינמי.',
  },
  {
    question: 'התבניות מתאימות לכל בעל מקצוע?',
    answer:
      'כן. התבניות גנריות ומתאימות לכל ענף – אינסטלציה, חשמל, צבע, שיפוצים, אלומיניום, גינון ועוד. בכלי האוטומטי יש מחירון ייעודי לכל ענף.',
  },
];

const templateCards = [
  {
    href: '/templates/word',
    download: true,
    icon: FileText,
    title: 'תבנית Word (.doc)',
    desc: 'מסמך מעוצב לעריכה ב-Word או Google Docs. הוסף לוגו ופרטים ומלא ידנית.',
    cta: 'הורד תבנית Word',
  },
  {
    href: '/templates/excel',
    download: true,
    icon: FileSpreadsheet,
    title: 'תבנית Excel (.csv)',
    desc: 'גיליון לחישוב הצעת מחיר, נפתח ב-Excel או Google Sheets. מלא כמויות ומחירים.',
    cta: 'הורד תבנית Excel',
  },
  {
    href: '/templates/print',
    download: false,
    icon: Printer,
    title: 'תבנית PDF להדפסה',
    desc: 'עמוד נקי בעיצוב A4 להדפסה או שמירה כ-PDF ישירות מהדפדפן.',
    cta: 'פתח תבנית להדפסה',
  },
];

export default function TemplatesPage() {
  const breadcrumbItems = [
    { label: 'דף הבית', url: absoluteUrl('/landing') ?? '/landing' },
    { label: 'טפסים ותבניות', url: absoluteUrl('/templates') ?? '/templates' },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={buildFaqJsonLd(faq)} />

      <main className="min-h-screen bg-[#F8FAFC]" dir="rtl">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Breadcrumbs
            items={[{ label: 'דף הבית', href: '/landing' }, { label: 'טפסים ותבניות' }]}
          />

          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] leading-tight mb-4">
            טופס הצעת מחיר להורדה – חינם
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            הורד תבנית הצעת מחיר מקצועית בפורמט שנוח לך – Word לעריכה, Excel לחישוב, או PDF
            להדפסה. כל התבניות חינמיות וללא הרשמה. רוצה לחסוך זמן ולא לטעות בחישוב? בנה הצעת מחיר
            חכמה עם מחירון מובנה שמתמלאת ומחושבת לבד.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            {templateCards.map(({ href, download, icon: Icon, title, desc, cta }) => (
              <Link
                key={href}
                href={href}
                {...(download ? { download: '' } : {})}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb] mb-3">
                  <Icon size={22} aria-hidden />
                </span>
                <h2 className="text-base font-bold text-[#0F172A] mb-1">{title}</h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-3 flex-1">{desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563eb]">
                  {cta}
                  <ArrowLeft size={16} aria-hidden />
                </span>
              </Link>
            ))}
          </div>

          <SeoCta
            title="עדיף על כל תבנית: בנה הצעת מחיר חכמה"
            subtitle="מחירון מובנה לכל ענף, חישוב סכומים ומע&quot;מ אוטומטי – הרשמה חינמית לייצוא PDF ושליחה בוואטסאפ."
          />

          <section className="mt-4">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">
              למה טופס חכם עדיף על תבנית סטטית
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              תבנית Word או Excel נראית אותו דבר אצל כולם, מחייבת למלא ידנית כל שורה, ולא מחשבת
              סכומים לבד. כל טעות בהקלדה או בנוסחה עלולה לעלות לך ברווח או להביך מול הלקוח – ובעיקר,
              אין מחירון מובנה אז צריך לזכור מחירים בעל פה.
            </p>
            <p className="text-slate-600 leading-relaxed">
              בונה הצעות המחיר משלב את כל היתרונות: בוחרים ענף ועבודות מתוך מחירון מקצועי, מסמנים
              תוספות, והסכום והמע&quot;מ מתחשבים אוטומטית. מוסיפים לוגו פעם אחת, וכל הצעה יוצאת
              ממותגת כ-PDF מוכן לשליחה בוואטסאפ – ישירות מהנייד, בפחות מדקה.
            </p>
          </section>

          <div className="my-12">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">שאלות נפוצות</h2>
            <SeoFaqList items={faq} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-700 font-medium mb-4">מדריכים ומחירונים נוספים</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link
                href="/guides/price-quote-template"
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                מדריך: טופס הצעת מחיר
              </Link>
              <Link
                href="/guides"
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                כל המדריכים
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                מחירונים לפי ענף
              </Link>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}

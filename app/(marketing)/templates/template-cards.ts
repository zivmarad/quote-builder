import type { TemplateCard } from './TemplateDownloadCards';

/** כרטיסי הורדה משותפים לעמוד הטפסים ולמדריכי התבניות. */
export const TEMPLATE_DOWNLOAD_CARDS: TemplateCard[] = [
  {
    href: '/templates/word',
    download: true,
    icon: 'word',
    title: 'תבנית Word (.doc)',
    desc: 'מסמך מעוצב לעריכה ב-Word או Google Docs. הוסף לוגו ופרטים ומלא ידנית.',
    cta: 'הורד תבנית Word',
  },
  {
    href: '/templates/excel',
    download: true,
    icon: 'excel',
    title: 'תבנית Excel (.csv)',
    desc: 'גיליון לחישוב הצעת מחיר, נפתח ב-Excel או Google Sheets. מלא כמויות ומחירים.',
    cta: 'הורד תבנית Excel',
  },
  {
    href: '/templates/print',
    download: false,
    icon: 'print',
    title: 'תבנית PDF להדפסה',
    desc: 'עמוד נקי בעיצוב A4 להדפסה או שמירה כ-PDF ישירות מהדפדפן.',
    cta: 'פתח תבנית להדפסה',
  },
];

/** מדריכים שבהם מציגים הורדה מיידית (כוונת SERP של תבנית/טופס). */
export const GUIDE_SLUGS_WITH_DOWNLOADS = new Set([
  'price-quote-template',
  'price-quote-word',
  'price-quote-excel',
]);

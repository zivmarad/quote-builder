import type { Metadata } from 'next';
import { withSiteMetadata } from '@/lib/site-metadata';
import PrintableQuoteTemplate from './PrintableQuoteTemplate';

/** כלי עזר להדפסה – לא לאינדקס; הקנוניקלי מצביע לעמוד הטפסים. */
export const metadata: Metadata = withSiteMetadata('/templates', {
  title: 'תבנית הצעת מחיר להדפסה / PDF',
  description: 'תבנית הצעת מחיר ריקה להדפסה או שמירה כ-PDF ישירות מהדפדפן.',
  robots: { index: false, follow: true },
});

export default function PrintTemplatePage() {
  return <PrintableQuoteTemplate />;
}

import type { ExportMethod, QuoteWorkflowStatus, SavedQuote } from '../app/contexts/QuoteHistoryContext';

export const quoteStatusColorClasses: Record<QuoteWorkflowStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-50 text-blue-700',
  approved: 'bg-green-50 text-green-700',
  paid: 'bg-emerald-600 text-white',
};

export const downloadedBadgeColorClass = 'bg-violet-50 text-violet-700';

export type QuoteBadgeLabels = {
  downloaded: string;
  sent: string;
  draft: string;
  approved: string;
  paid: string;
};

/** תגית רשימת הצעות: הורדה / שליחה / סטטוס עסקי (טיוטה, אושר, שולם). */
export function getQuoteListBadge(
  quote: SavedQuote,
  labels: QuoteBadgeLabels
): { label: string; colorClass: string } {
  const workflow = quote.quoteStatus ?? 'draft';

  if (workflow === 'approved' || workflow === 'paid') {
    return { label: labels[workflow], colorClass: quoteStatusColorClasses[workflow] };
  }

  if (quote.status === 'download') {
    return { label: labels.downloaded, colorClass: downloadedBadgeColorClass };
  }

  if (quote.status === 'whatsapp' || quote.status === 'email' || workflow === 'sent') {
    return { label: labels.sent, colorClass: quoteStatusColorClasses.sent };
  }

  return { label: labels.draft, colorClass: quoteStatusColorClasses.draft };
}

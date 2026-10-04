'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuoteHistory, type SavedQuote } from '../contexts/QuoteHistoryContext';
import { useQuoteBasket } from '../contexts/QuoteBasketContext';
import { useProfile } from '../contexts/ProfileContext';
import { useSettings } from '../contexts/SettingsContext';

type TrackFilter = 'all' | 'waiting' | 'approved';

function isApproved(quote: SavedQuote) {
  return quote.quoteStatus === 'approved' || quote.quoteStatus === 'paid';
}

export default function PastQuotesPage() {
  const router = useRouter();
  const { t, dir, locale } = useLanguage();
  const { quotes, isLoaded, updateQuoteStatus } = useQuoteHistory();
  const { loadBasket } = useQuoteBasket();
  const { profile } = useProfile();
  const { vatRate, validityDays } = useSettings();
  const [filter, setFilter] = useState<TrackFilter>('all');
  const [query, setQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const dateLocale = locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar' : locale === 'ru' ? 'ru-RU' : 'en';

  const ordered = useMemo(
    () => [...quotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [quotes],
  );
  const waitingCount = ordered.filter((quote) => !isApproved(quote)).length;
  const approvedCount = ordered.length - waitingCount;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ordered.filter((quote) => {
      if (filter === 'waiting' && isApproved(quote)) return false;
      if (filter === 'approved' && !isApproved(quote)) return false;
      if (!q) return true;
      return (quote.customerName || '').toLowerCase().includes(q);
    });
  }, [ordered, filter, query]);

  const setTracked = (quote: SavedQuote, approved: boolean) => {
    if (approved) {
      if (!isApproved(quote)) updateQuoteStatus(quote.id, 'approved');
      return;
    }
    if (isApproved(quote)) updateQuoteStatus(quote.id, 'sent');
  };

  const duplicateQuote = (quote: SavedQuote) => {
    sessionStorage.setItem('quoteBuilder_pendingDraft', JSON.stringify({
      customerName: quote.customerName || '',
      customerPhone: quote.customerPhone || '',
      customerEmail: quote.customerEmail || '',
      customerAddress: quote.customerAddress || '',
      customerCompanyId: quote.customerCompanyId || '',
      notes: quote.notes || '',
      discountType: quote.discount?.type,
      discountValue: quote.discount?.value != null ? String(quote.discount.value) : '',
    }));
    loadBasket(quote.items, quote.discount);
    router.push('/cart');
  };

  const downloadQuote = async (quote: SavedQuote) => {
    if (downloadingId) return;
    const snap = quote.quote_data ?? quote.quoteData;
    setDownloadingId(quote.id);
    try {
      const { generateQuotePDFAsBlob } = await import('../components/utils/pdfExport');
      const blob = await generateQuotePDFAsBlob(
        quote.items,
        quote.totalBeforeVAT,
        quote.VAT,
        quote.totalWithVAT,
        snap?.profile ?? profile,
        quote.customerName ?? undefined,
        quote.notes ?? undefined,
        snap?.quoteTitle,
        quote.quoteNumber ?? undefined,
        quote.customerPhone ?? undefined,
        quote.customerEmail ?? undefined,
        quote.customerAddress ?? undefined,
        quote.customerCompanyId ?? undefined,
        snap?.validityDays ?? validityDays,
        snap?.vatRate ?? vatRate,
        quote.subtotalBeforeDiscount,
        quote.discountAmount,
        quote.discount,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hatzaat-mechir-${quote.createdAt.slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  };

  const filters: { id: TrackFilter; label: string; count: number }[] = [
    { id: 'all', label: t('home.quotesAll'), count: ordered.length },
    { id: 'waiting', label: t('home.quotesWaiting'), count: waitingCount },
    { id: 'approved', label: t('home.quotesApproved'), count: approvedCount },
  ];

  return (
    <main className="min-h-screen bg-[#f3f6fb] pb-16" dir={dir}>
      <div className="mx-auto max-w-md px-5 pt-4 text-slate-900">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500"
        >
          <ArrowRight size={18} />
          {t('common.back')}
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t('home.pastQuotes')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('home.quotesHint')}</p>

        <div className="mt-4 flex gap-2">
          {filters.map((item) => {
            const selected = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  selected ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {item.label} · {item.count}
              </button>
            );
          })}
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">{t('home.quotesSearch')}</span>
          <Search className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('home.quotesSearch')}
            className="w-full rounded-full border border-white bg-white py-3.5 pe-12 ps-4 text-sm shadow-[0_8px_24px_rgba(15,23,42,0.06)] placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
            dir={dir}
            autoComplete="off"
          />
        </label>

        {!isLoaded ? (
          <p className="mt-8 text-center text-sm text-slate-400">{t('common.loading')}</p>
        ) : ordered.length === 0 ? (
          <p className="mt-8 rounded-[28px] bg-white px-4 py-10 text-center text-sm text-slate-500">
            {t('home.quotesEmpty')}
          </p>
        ) : visible.length === 0 ? (
          <p className="mt-8 rounded-[28px] bg-white px-4 py-10 text-center text-sm text-slate-500">
            {t('home.quotesNoMatch')}
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {visible.map((quote) => {
              const approved = isApproved(quote);
              const name = quote.customerName?.trim() || t('home.pastQuoteUntitled');
              const date = new Date(quote.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <li key={quote.id} className="rounded-[28px] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{date}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">
                      ₪{quote.totalWithVAT.toLocaleString(dateLocale)}
                    </p>
                  </div>
                  <div className="mt-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setTracked(quote, false)}
                      className={`rounded-full py-2.5 text-sm font-semibold ${
                        approved ? 'bg-[#f3f6fb] text-slate-500' : 'bg-slate-800 text-white'
                      }`}
                    >
                      {t('home.quotesNotApproved')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTracked(quote, true)}
                      className={`rounded-full py-2.5 text-sm font-semibold ${
                        approved ? 'bg-emerald-700 text-white' : 'bg-[#f3f6fb] text-slate-500'
                      }`}
                    >
                      {t('home.quotesApprovedMark')}
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void downloadQuote(quote)}
                      className="rounded-full bg-[#f3f6fb] px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      {downloadingId === quote.id ? t('profile.downloading') : t('home.quotesFile')}
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateQuote(quote)}
                      className="rounded-full bg-[#f3f6fb] px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      {t('profile.duplicate')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

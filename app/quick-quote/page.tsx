'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuoteBasket, type BasketItem } from '../contexts/QuoteBasketContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  FREE_QUOTE_CATEGORY,
  FREE_QUOTE_UNIT,
  freeQuoteLineBase,
  freeQuoteQty,
  freeQuoteUnitPrice,
  isFreeQuoteItem,
} from '../../lib/free-quote';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { calculateQuoteTotals } from '../../lib/quote-discount';

function parseQty(raw: string): number {
  const n = parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.round(n * 100) / 100;
}

function parsePrice(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, '');
  if (trimmed === '') return null;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function formatShekel(price: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price || 0);
}

function rowPayload(name: string, qty: number, unitPrice: number, notes: string) {
  return {
    name,
    category: FREE_QUOTE_CATEGORY,
    quantity: qty,
    unit: FREE_QUOTE_UNIT,
    basePrice: freeQuoteLineBase(unitPrice, qty),
    overridePrice: undefined,
    description: notes.trim() || undefined,
  };
}

function SavedRow({
  item,
  onCommit,
  onDelete,
  onEnterPrice,
}: {
  item: BasketItem;
  onCommit: (id: string, name: string, qty: number, unitPrice: number, notes: string) => void;
  onDelete: (id: string) => void;
  onEnterPrice: () => void;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(String(freeQuoteQty(item)));
  const [price, setPrice] = useState(String(freeQuoteUnitPrice(item)));
  const [notes, setNotes] = useState(item.description ?? '');

  const commit = () => {
    const trimmed = name.trim();
    const unitPrice = parsePrice(price);
    if (!trimmed || unitPrice == null) return;
    const qtyNum = parseQty(qty);
    const notesTrim = notes.trim();
    if (
      trimmed === item.name &&
      qtyNum === freeQuoteQty(item) &&
      unitPrice === freeQuoteUnitPrice(item) &&
      notesTrim === (item.description ?? '').trim()
    ) {
      return;
    }
    onCommit(item.id, trimmed, qtyNum, unitPrice, notes);
  };

  const lineTotal = freeQuoteLineBase(parsePrice(price) ?? 0, parseQty(qty));
  const notesFieldClass =
    'w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        placeholder={t('quickQuote.workPlaceholder')}
        className="w-full mb-2 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        aria-label={t('quickQuote.work')}
      />
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`qty-${item.id}`}>
          {t('quickQuote.qty')}
        </label>
        <input
          id={`qty-${item.id}`}
          type="number"
          min={1}
          step="any"
          inputMode="decimal"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onBlur={commit}
          className="w-[4.5rem] shrink-0 px-2 py-2.5 rounded-xl border border-slate-200 text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-slate-400 text-sm shrink-0">×</span>
        <input
          type="number"
          min={0}
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
              onEnterPrice();
            }
          }}
          placeholder={t('quickQuote.price')}
          dir="ltr"
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
          aria-label={t('quickQuote.price')}
        />
        <span className="w-[4.75rem] shrink-0 text-left font-bold text-slate-900 tabular-nums text-sm">
          {formatShekel(lineTotal)}
        </span>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
          aria-label={t('quickQuote.deleteRow')}
        >
          <Trash2 size={18} />
        </button>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={commit}
        rows={2}
        placeholder={t('quickQuote.notesPlaceholder')}
        className={notesFieldClass}
        aria-label={t('quickQuote.notes')}
      />
      {item.extras && item.extras.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          {t('quickQuote.extrasNote')} {item.extras.map((e) => e.text).join(' · ')}
        </p>
      )}
    </div>
  );
}

export default function QuickQuotePage() {
  const router = useRouter();
  const { t, dir } = useLanguage();
  const { vatRate } = useSettings();
  const {
    items,
    addItem,
    updateItem,
    removeItem,
    isLoaded,
    itemCount,
    subtotalBeforeDiscount,
    discount,
  } = useQuoteBasket();

  const [draftName, setDraftName] = useState('');
  const [draftQty, setDraftQty] = useState('1');
  const [draftPrice, setDraftPrice] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const draftNameRef = useRef<HTMLInputElement>(null);

  const freeItems = useMemo(() => items.filter(isFreeQuoteItem), [items]);
  const catalogCount = items.length - freeItems.length;

  const liveTotals = useMemo(() => {
    const draftUnit = parsePrice(draftPrice);
    const draftLine =
      draftName.trim() && draftUnit != null ? freeQuoteLineBase(draftUnit, parseQty(draftQty)) : 0;
    return calculateQuoteTotals(subtotalBeforeDiscount + draftLine, vatRate, discount);
  }, [draftName, draftPrice, draftQty, subtotalBeforeDiscount, vatRate, discount]);

  useEffect(() => {
    trackEvent(AnalyticsEvents.QuickQuoteOpened);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const id = window.setTimeout(() => draftNameRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, [isLoaded]);

  const commitDraft = useCallback((): boolean => {
    const name = draftName.trim();
    const unitPrice = parsePrice(draftPrice);
    if (!name || unitPrice == null) return false;
    addItem({
      ...rowPayload(name, parseQty(draftQty), unitPrice, draftNotes),
      extras: undefined,
    });
    setDraftName('');
    setDraftQty('1');
    setDraftPrice('');
    setDraftNotes('');
    return true;
  }, [addItem, draftName, draftPrice, draftQty, draftNotes]);

  const handleSavedCommit = (id: string, name: string, qty: number, unitPrice: number, notes: string) => {
    updateItem(id, {
      ...rowPayload(name, qty, unitPrice, notes),
    });
  };

  const handleContinue = () => {
    const added = commitDraft();
    if (itemCount === 0 && !added) {
      setHint(t('quickQuote.needOneRow'));
      draftNameRef.current?.focus();
      return;
    }
    router.push('/cart');
  };

  const handleDraftPriceEnter = () => {
    const added = commitDraft();
    requestAnimationFrame(() => draftNameRef.current?.focus());
    if (!added) setHint(t('quickQuote.needOneRow'));
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]" dir={dir}>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-40 sm:pb-36">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-6 min-h-[44px]"
        >
          <ArrowRight size={20} /> {t('quickQuote.backHome')}
        </Link>

        <header className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">{t('quickQuote.pageTitle')}</h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">{t('quickQuote.pageSubtitle')}</p>
        </header>

        {catalogCount > 0 && (
          <p className="mb-4 text-xs sm:text-sm text-slate-500 rounded-xl border border-slate-200 bg-white px-3 py-2">
            {t('quickQuote.catalogNote').replace('{{count}}', String(catalogCount))}
          </p>
        )}

        <div className="space-y-3">
          {freeItems.map((item) => (
            <SavedRow
              key={`${item.id}:${item.name}:${item.quantity}:${item.basePrice}:${item.overridePrice ?? ''}:${item.description ?? ''}`}
              item={item}
              onCommit={handleSavedCommit}
              onDelete={removeItem}
              onEnterPrice={() => draftNameRef.current?.focus()}
            />
          ))}

          <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-white p-3 sm:p-4">
            <input
              ref={draftNameRef}
              type="text"
              value={draftName}
              onChange={(e) => {
                setDraftName(e.target.value);
                if (hint) setHint(null);
              }}
              placeholder={t('quickQuote.workPlaceholder')}
              className="w-full mb-2 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              aria-label={t('quickQuote.work')}
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                step="any"
                inputMode="decimal"
                value={draftQty}
                onChange={(e) => setDraftQty(e.target.value)}
                className="w-[4.5rem] shrink-0 px-2 py-2.5 rounded-xl border border-slate-200 text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={t('quickQuote.qty')}
              />
              <span className="text-slate-400 text-sm shrink-0">×</span>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleDraftPriceEnter();
                  }
                }}
                placeholder={t('quickQuote.price')}
                dir="ltr"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                aria-label={t('quickQuote.price')}
              />
              <span className="w-[4.75rem] shrink-0 text-left font-bold text-slate-400 tabular-nums text-sm">
                {parsePrice(draftPrice) == null
                  ? '—'
                  : formatShekel(freeQuoteLineBase(parsePrice(draftPrice) ?? 0, parseQty(draftQty)))}
              </span>
              <span className="w-9 shrink-0" aria-hidden />
            </div>
            <textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              rows={2}
              placeholder={t('quickQuote.notesPlaceholder')}
              className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              aria-label={t('quickQuote.notes')}
            />
          </div>
        </div>

        {freeItems.length === 0 && !draftName && (
          <p className="mt-3 text-xs text-slate-400">{t('quickQuote.emptyHint')}</p>
        )}

        {hint && <p className="mt-3 text-sm font-medium text-red-600">{hint}</p>}

        <button
          type="button"
          onClick={() => {
            commitDraft();
            requestAnimationFrame(() => draftNameRef.current?.focus());
          }}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          <Plus size={16} />
          {t('quickQuote.addRow')}
        </button>
      </div>

      <div
        className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-lg mx-auto px-4 pt-3 space-y-2">
          {liveTotals.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-700">
              <span>{t('quickQuote.discount')}</span>
              <span className="font-bold">-{formatShekel(liveTotals.discountAmount)}</span>
            </div>
          )}
          {(itemCount > 0 || liveTotals.subtotalBeforeDiscount > 0) && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>
                {vatRate === 0
                  ? t('quickQuote.exempt')
                  : `${t('quickQuote.vat')} (${Math.round(vatRate * 100)}%)`}
              </span>
              <span className="font-bold text-slate-900">{formatShekel(liveTotals.VAT)}</span>
            </div>
          )}
          {liveTotals.subtotalBeforeDiscount > 0 && vatRate > 0 && (
            <div className="flex justify-between text-xs text-slate-400">
              <span>{t('quickQuote.subtotal')}</span>
              <span>{formatShekel(liveTotals.subtotalBeforeDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-black text-slate-900">{t('quickQuote.total')}</span>
            <span className="text-xl font-black text-blue-600 tabular-nums">
              {formatShekel(liveTotals.totalWithVAT)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full min-h-[48px] rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-base shadow-lg shadow-blue-600/20"
          >
            {t('quickQuote.continue')}
          </button>
        </div>
      </div>
    </main>
  );
}

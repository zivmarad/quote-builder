'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuoteBasket } from '../contexts/QuoteBasketContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSpotlightOnboarding } from '../hooks/useSpotlightOnboarding';
import { SPOTLIGHT_RING_CLASS } from '@/lib/spotlight-onboarding';
import SpotlightOverlay from './onboarding/SpotlightOverlay';

const HIDE_PATHS = [
  '/cart',
  '/quick-quote',
  '/login',
  '/signup',
  '/profile',
  '/checkout',
  '/contact',
  '/privacy',
  '/terms',
  '/admin',
  '/forgot-password',
  '/forgot-username',
];

export default function FloatingCartButton() {
  const { itemCount, totalWithVAT } = useQuoteBasket();
  const router = useRouter();
  const pathname = usePathname();
  const { t, dir } = useLanguage();
  const { shouldShow, dismissPage, complete, seenPages } = useSpotlightOnboarding();
  const prevCountRef = useRef(itemCount);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const [bounce, setBounce] = useState(false);

  const showGoCartSpotlight = shouldShow('go-cart') && itemCount > 0 && seenPages.includes('service');

  useEffect(() => {
    if (itemCount > prevCountRef.current && itemCount > 0) {
      const raf = requestAnimationFrame(() => setBounce(true));
      const timer = setTimeout(() => setBounce(false), 600);
      prevCountRef.current = itemCount;
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  if (itemCount === 0 && !showGoCartSpotlight) return null;

  const parts = pathname.split('/').filter(Boolean);
  const isCategoryServicePage = parts[0] === 'category' && parts.length >= 3;
  const isServiceSelectionPage = pathname === '/' || (parts[0] === 'category' && parts.length === 2);

  if (
    !showGoCartSpotlight &&
    (HIDE_PATHS.includes(pathname) || isCategoryServicePage || !isServiceSelectionPage)
  ) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const ForwardIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const jobsLabel =
    itemCount === 1
      ? t('common.quoteJobOne', 'עבודה אחת')
      : `${itemCount} ${t('common.quoteJobs', 'עבודות')}`;

  return (
    <>
      <button
        ref={cartButtonRef}
        type="button"
        onClick={() => {
          if (showGoCartSpotlight) {
            dismissPage('go-cart');
            complete();
          }
          router.push('/cart');
        }}
        className={`fixed bottom-5 left-4 right-4 mx-auto flex max-w-md items-center gap-3 rounded-full bg-blue-900 px-3 py-2.5 text-white shadow-lg active:scale-[0.98] transition-all duration-300 ${showGoCartSpotlight ? `z-[53] ${SPOTLIGHT_RING_CLASS}` : 'z-[52]'} ${bounce ? 'cart-bump' : ''}`}
        style={{ marginBottom: 'max(0px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="min-w-0 ps-2 text-start">
          <span className="block text-[11px] font-medium leading-tight text-white/70">{jobsLabel}</span>
          <span className="text-lg font-semibold tabular-nums leading-tight">{formatPrice(totalWithVAT)}</span>
        </div>
        <span className="flex min-h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-blue-900">
          {t('common.continueToQuote', 'המשך להצעה')}
          <ForwardIcon size={18} aria-hidden />
        </span>
      </button>

      <SpotlightOverlay
        open={showGoCartSpotlight}
        targetRef={cartButtonRef}
        title={t('spotlight.goCartTitle')}
        body={t('spotlight.goCartBody')}
        skipLabel={t('spotlight.skip')}
        step={4}
        onDismiss={() => dismissPage('go-cart')}
      />
    </>
  );
}

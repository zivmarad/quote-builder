'use client';

import Link from 'next/link';
import { Sparkles, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ONBOARDING_QUICK_START } from '@/lib/first-visit-onboarding';

export default function FirstVisitQuickStartCard() {
  const { t } = useLanguage();
  const href = `/category/${ONBOARDING_QUICK_START.categoryId}/${ONBOARDING_QUICK_START.serviceId}`;

  return (
    <Link
      href={href}
      className="group block mb-6 rounded-2xl bg-gradient-to-l from-blue-600 to-blue-700 text-white p-5 sm:p-6 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 text-right flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold mb-3">
            <Sparkles size={14} />
            {t('onboarding.quickStartBadge')}
          </div>
          <p className="text-lg sm:text-xl font-black leading-snug mb-1">{t('onboarding.quickStartTitle')}</p>
          <p className="text-sm text-blue-100 leading-relaxed">{t('onboarding.quickStartSubtitle')}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 group-hover:bg-white/25 transition-colors">
          <ChevronLeft size={24} className="rotate-180" />
        </span>
      </div>
    </Link>
  );
}

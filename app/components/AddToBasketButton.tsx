'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuoteBasket, BasketExtra } from '../contexts/QuoteBasketContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSpotlightOnboarding } from '../hooks/useSpotlightOnboarding';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { ChevronLeft } from 'lucide-react';

interface AddToBasketButtonProps {
  service: {
    name: string;
    category: string;
    basePrice: number;
    extras: BasketExtra[];
    description?: string;
    quantity?: number;
    unit?: string;
  };
}

export default function AddToBasketButton({ service }: AddToBasketButtonProps) {
  const router = useRouter();
  const { addItem } = useQuoteBasket();
  const { t } = useLanguage();
  const { shouldShow, dismissPage } = useSpotlightOnboarding();

  const handleAdd = () => {
    addItem({
      name: service.name,
      category: service.category,
      basePrice: service.basePrice,
      extras: service.extras,
      description: service.description || '',
      quantity: service.quantity,
      unit: service.unit,
    });

    trackEvent(AnalyticsEvents.AddToCart, { category: service.category });

    if (shouldShow('service')) {
      dismissPage('service');
    }

    // חזרה דטרמיניסטית לעמוד הקטגוריה (כדי להוסיף עוד שירותים) — ולא router.back()
    // שתלוי בהיסטוריית הדפדפן ועלול להחזיר לדף שממנו הגענו (למשל מחירון/מדריך).
    if (service.category) {
      router.push(`/category/${encodeURIComponent(service.category)}`);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleAdd}
      className="w-full min-h-12 py-3 px-4 rounded-full font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] bg-white text-blue-900 shadow-sm"
    >
      <span>{t('common.addToCart', 'הוסף להצעה')}</span>
      <ChevronLeft size={18} aria-hidden />
    </button>
  );
}

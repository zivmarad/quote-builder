'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuoteBasket } from '../contexts/QuoteBasketContext';
import { ShoppingCart } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function FloatingCartButton() {
  const { user } = useAuth();
  const { itemCount, totalWithVAT } = useQuoteBasket();
  const router = useRouter();
  const pathname = usePathname();

  /** סל משויך למשתמש – מי שלא מחובר לא רואה את באנר הסל. */
  if (!user) {
    return null;
  }
  if (itemCount === 0) {
    return null;
  }
  /** בדף הסל ובדף שירות (שאלות + מחיר למטה) לא מציגים את הבאנר – כדי שלא יסתיר את "סה״כ לתשלום". */
  const parts = pathname.split('/').filter(Boolean);
  if (pathname === '/cart' || (parts[0] === 'category' && parts.length >= 3)) {
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

  return (
    <button
      onClick={() => router.push('/cart')}
      className="fixed z-50 flex items-center gap-2 sm:gap-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl sm:rounded-full shadow-2xl hover:shadow-blue-500/50 active:scale-[0.98] sm:hover:scale-105 transition-all duration-300 group min-h-[56px] pl-4 pr-4 sm:pl-6 sm:pr-6 py-3 sm:py-4 bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:bottom-6"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="relative shrink-0">
        <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
          {itemCount}
        </span>
      </div>
      <div className="h-6 sm:h-8 w-px bg-white/30 hidden sm:block" />
      <div className="text-right flex-1 sm:flex-initial min-w-0">
        <div className="text-[10px] sm:text-xs opacity-90">סה״כ הצעת מחיר</div>
        <div className="text-base sm:text-lg font-bold tabular-nums">{formatPrice(totalWithVAT)}</div>
      </div>
    </button>
  );
}
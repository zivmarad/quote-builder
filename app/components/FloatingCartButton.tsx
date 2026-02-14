'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuoteBasket } from '../contexts/QuoteBasketContext';
import { ShoppingCart } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const HIDE_PATHS = ['/cart', '/login', '/signup', '/profile', '/checkout', '/contact', '/privacy', '/terms', '/admin', '/forgot-password', '/forgot-username'];

export default function FloatingCartButton() {
  const { itemCount, totalWithVAT } = useQuoteBasket();
  const router = useRouter();
  const pathname = usePathname();
  const prevCountRef = useRef(itemCount);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (itemCount > prevCountRef.current && itemCount > 0) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 600);
      return () => clearTimeout(t);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  if (itemCount === 0) return null;

  const parts = pathname.split('/').filter(Boolean);
  const isCategoryServicePage = parts[0] === 'category' && parts.length >= 3;
  const isServiceSelectionPage = pathname === '/' || (parts[0] === 'category' && parts.length === 2);
  if (HIDE_PATHS.includes(pathname) || isCategoryServicePage || !isServiceSelectionPage) {
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
      className={`fixed z-50 flex items-center justify-between gap-3 sm:gap-4 bg-[#2563EB] text-white rounded-full shadow-xl hover:shadow-blue-500/40 active:scale-[0.98] sm:hover:scale-105 transition-all duration-300 group min-h-[64px] pl-5 pr-5 sm:pl-6 sm:pr-6 py-4 bottom-5 left-5 right-5 sm:left-auto sm:right-6 sm:min-w-[200px] ${bounce ? 'cart-bump' : ''}`}
      style={{ marginBottom: 'max(20px, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="text-right flex-1 min-w-0 flex flex-col items-end gap-0.5">
        <div className="text-[10px] sm:text-xs opacity-90 leading-tight">סה״כ הצעת מחיר</div>
        <div className="text-base sm:text-lg font-bold tabular-nums leading-tight">{formatPrice(totalWithVAT)}</div>
      </div>
      <div className="relative shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/25 sm:bg-white">
        <ShoppingCart size={22} className="text-white group-hover:scale-110 transition-transform sm:text-[#2563EB]" />
        <span className="absolute -top-1 -right-1 bg-violet-400 text-white text-xs font-bold rounded-full h-5 w-5 min-w-[20px] flex items-center justify-center shadow-sm">
          {itemCount}
        </span>
      </div>
    </button>
  );
}
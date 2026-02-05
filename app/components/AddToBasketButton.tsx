'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuoteBasket, BasketExtra } from '../contexts/QuoteBasketContext';
import { ShoppingCart } from 'lucide-react';

interface AddToBasketButtonProps {
  service: {
    name: string;
    category: string;
    basePrice: number;
    extras: BasketExtra[];
    description?: string;
  };
}

export default function AddToBasketButton({ service }: AddToBasketButtonProps) {
  const router = useRouter();
  const { addItem } = useQuoteBasket();

  const handleAdd = () => {
    addItem({
      name: service.name,
      category: service.category,
      basePrice: service.basePrice,
      extras: service.extras,
      description: service.description || '',
    });
    // חזרה שלב אחד אחורה להמשיך לבחור (למשל מדף שירות חזרה לתיקיית הקטגוריה)
    router.back();
  };

  return (
    <button
      onClick={handleAdd}
      className="w-full py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 bg-white text-slate-900 hover:bg-blue-50 shadow-sm"
    >
      <ShoppingCart size={18} />
      <span>הוסף לסל</span>
    </button>
  );
}
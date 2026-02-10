'use client'; // חובה כדי שהסל והלוגיקה שלו יעבדו

import React from 'react';
import Cart from '../components/Cart';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CartPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-8 px-3 sm:px-4 pb-28 sm:pb-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 font-medium transition-all hover:-translate-x-1 min-h-[44px] items-center"
        >
          <ArrowRight size={20} />
          <span>חזרה לבחירת שירותים</span>
        </Link>

        {/* קומפוננטת הסל שמרכזת את כל הלוגיקה */}
        <Cart />
      </div>
    </div>
  );
}
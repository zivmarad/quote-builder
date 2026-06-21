'use client';

import React, { useEffect } from 'react';
import Cart from '../components/Cart';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useSpotlightOnboarding } from '../hooks/useSpotlightOnboarding';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

export default function CartPage() {
  const { complete, isActive } = useSpotlightOnboarding();
  const { user, isLoaded } = useAuth();

  useEffect(() => {
    if (isActive) {
      complete();
    }
  }, [isActive, complete]);

  useEffect(() => {
    if (!isLoaded) return;
    trackEvent(AnalyticsEvents.CartViewed, { guest: !user });
  }, [isLoaded, user]);

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

        <Cart />
      </div>
    </div>
  );
}

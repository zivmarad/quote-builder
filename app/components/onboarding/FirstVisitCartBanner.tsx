'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { PartyPopper } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { isCartWelcomeVisible, subscribeCartWelcome } from '@/lib/first-visit-onboarding';

/** באנר חד-פעמי בסל – מוצג אחרי ההצעה הראשונה בסשן. */
export default function FirstVisitCartBanner() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const visible = useSyncExternalStore(subscribeCartWelcome, isCartWelcomeVisible, () => false);

  if (!visible) return null;

  return (
    <div
      className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-l from-emerald-50 to-white p-5 sm:p-6"
      role="status"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <PartyPopper size={24} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <h2 className="text-lg font-black text-slate-900 mb-1">{t('onboarding.cartWelcomeTitle')}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{t('onboarding.cartWelcomeSubtitle')}</p>
          {!user && (
            <Link
              href="/signup"
              className="inline-block mt-3 text-sm font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2"
            >
              {t('onboarding.cartSignupCta')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

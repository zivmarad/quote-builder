'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShoppingCart, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFirstVisitOnboarding } from '../../contexts/FirstVisitOnboardingContext';

export default function FirstVisitCelebrationToast() {
  const { t } = useLanguage();
  const router = useRouter();
  const { showCelebration, dismissCelebration } = useFirstVisitOnboarding();

  useEffect(() => {
    if (!showCelebration) return;
    const tId = setTimeout(dismissCelebration, 8000);
    return () => clearTimeout(tId);
  }, [showCelebration, dismissCelebration]);

  if (!showCelebration) return null;

  return (
    <div
      className="fixed inset-x-0 z-[60] flex justify-center px-4 pointer-events-none onboarding-toast-enter"
      style={{ top: 'max(5.5rem, calc(var(--safe-area-inset-top, 0px) + 4.5rem))' }}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700/50 p-4 onboarding-toast-enter">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="font-black text-base">{t('onboarding.addedTitle')}</p>
            <p className="text-sm text-slate-300 mt-0.5">{t('onboarding.addedSubtitle')}</p>
            <button
              type="button"
              onClick={() => {
                dismissCelebration();
                router.push('/cart');
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-bold transition-colors"
            >
              <ShoppingCart size={16} />
              {t('onboarding.viewCart')}
            </button>
          </div>
          <button
            type="button"
            onClick={dismissCelebration}
            className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

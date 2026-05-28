'use client';

import { useLanguage } from '../../contexts/LanguageContext';
import { useFirstVisitOnboarding } from '../../contexts/FirstVisitOnboardingContext';
import type { OnboardingStep } from '@/lib/first-visit-onboarding';

const STEPS: OnboardingStep[] = ['category', 'pricing', 'cart'];

export default function FirstVisitProgressBar() {
  const { t } = useLanguage();
  const { isActive, step, skipOnboarding } = useFirstVisitOnboarding();

  if (!isActive) return null;

  const currentIndex = STEPS.indexOf(step);

  return (
    <div
      className="bg-gradient-to-l from-blue-50 to-white border-b border-blue-100/80"
      role="navigation"
      aria-label={t('onboarding.progressLabel')}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs sm:text-sm font-bold text-blue-900">{t('onboarding.bannerTitle')}</p>
          <button
            type="button"
            onClick={skipOnboarding}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium shrink-0 px-2 py-1 rounded-lg hover:bg-white/80 transition-colors"
          >
            {t('onboarding.skipGuide')}
          </button>
        </div>
        <ol className="flex items-center gap-1 sm:gap-2">
          {STEPS.map((s, i) => {
            const done = i < currentIndex;
            const current = i === currentIndex;
            return (
              <li key={s} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                <div
                  className={`flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 rounded-xl px-2 sm:px-3 py-1.5 transition-colors ${
                    current
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : done
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-white text-slate-400 border border-slate-100'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full text-[10px] sm:text-xs font-black ${
                      current ? 'bg-white/20' : done ? 'bg-blue-200 text-blue-800' : 'bg-slate-100'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold truncate">{t(`onboarding.step.${s}`)}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <span
                    className={`hidden sm:block w-3 h-0.5 shrink-0 rounded-full ${done ? 'bg-blue-300' : 'bg-slate-200'}`}
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

'use client';

import { useLanguage } from '../../contexts/LanguageContext';
import { useFirstVisitOnboarding } from '../../contexts/FirstVisitOnboardingContext';

export default function FirstVisitPricingHint() {
  const { t } = useLanguage();
  const { isActive, step } = useFirstVisitOnboarding();

  if (!isActive || step !== 'pricing') return null;

  return (
    <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-right">
      <p className="text-sm font-bold text-blue-900">{t('onboarding.pricingHintTitle')}</p>
      <p className="text-xs text-blue-800/80 mt-0.5 leading-relaxed">{t('onboarding.pricingHintSubtitle')}</p>
    </div>
  );
}

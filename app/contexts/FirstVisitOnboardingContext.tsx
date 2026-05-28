'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  completeOnboarding,
  getStoredOnboardingStep,
  isOnboardingActive,
  persistOnboardingStep,
  resolveStepFromPathname,
  type OnboardingStep,
} from '@/lib/first-visit-onboarding';
import { markShowCartWelcome } from '../components/onboarding/FirstVisitCartBanner';

type FirstVisitOnboardingContextValue = {
  isActive: boolean;
  step: OnboardingStep;
  showAllCategories: boolean;
  setShowAllCategories: (v: boolean) => void;
  showCelebration: boolean;
  dismissCelebration: () => void;
  onFirstItemAdded: () => void;
  skipOnboarding: () => void;
};

const FirstVisitOnboardingContext = createContext<FirstVisitOnboardingContextValue | null>(null);

export function FirstVisitOnboardingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState<OnboardingStep>('category');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isActive = isOnboardingActive();
    setActive(isActive);
    if (isActive) {
      setStep(getStoredOnboardingStep());
    }
  }, []);

  useEffect(() => {
    if (!mounted || !active) return;
    const next = resolveStepFromPathname(pathname);
    setStep(next);
    persistOnboardingStep(next);
  }, [pathname, mounted, active]);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
    setActive(false);
    setShowCelebration(false);
  }, []);

  const onFirstItemAdded = useCallback(() => {
    if (!active) return;
    markShowCartWelcome();
    setShowCelebration(true);
    setStep('cart');
    persistOnboardingStep('cart');
    completeOnboarding();
    setActive(false);
  }, [active]);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const value = useMemo(
    () => ({
      isActive: mounted && active,
      step,
      showAllCategories,
      setShowAllCategories,
      showCelebration,
      dismissCelebration,
      onFirstItemAdded,
      skipOnboarding,
    }),
    [
      mounted,
      active,
      step,
      showAllCategories,
      showCelebration,
      dismissCelebration,
      onFirstItemAdded,
      skipOnboarding,
    ],
  );

  return (
    <FirstVisitOnboardingContext.Provider value={value}>{children}</FirstVisitOnboardingContext.Provider>
  );
}

export function useFirstVisitOnboarding(): FirstVisitOnboardingContextValue {
  const ctx = useContext(FirstVisitOnboardingContext);
  if (!ctx) {
    return {
      isActive: false,
      step: 'category',
      showAllCategories: true,
      setShowAllCategories: () => {},
      showCelebration: false,
      dismissCelebration: () => {},
      onFirstItemAdded: () => {},
      skipOnboarding: () => {},
    };
  }
  return ctx;
}

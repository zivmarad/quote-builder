'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  completeOnboarding,
  isOnboardingActive,
  markShowCartWelcome,
  persistOnboardingStep,
  resolveStepFromPathname,
  subscribeOnboarding,
  type OnboardingStep,
} from '@/lib/first-visit-onboarding';

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
  const storageActive = useSyncExternalStore(
    subscribeOnboarding,
    isOnboardingActive,
    () => false,
  );
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const step = storageActive ? resolveStepFromPathname(pathname) : ('category' as OnboardingStep);

  useEffect(() => {
    if (!storageActive) return;
    persistOnboardingStep(resolveStepFromPathname(pathname));
  }, [pathname, storageActive]);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
    setShowCelebration(false);
  }, []);

  const onFirstItemAdded = useCallback(() => {
    if (!storageActive) return;
    markShowCartWelcome();
    setShowCelebration(true);
    persistOnboardingStep('cart');
    completeOnboarding();
  }, [storageActive]);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const value = useMemo(
    () => ({
      isActive: storageActive,
      step,
      showAllCategories,
      setShowAllCategories,
      showCelebration,
      dismissCelebration,
      onFirstItemAdded,
      skipOnboarding,
    }),
    [
      storageActive,
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

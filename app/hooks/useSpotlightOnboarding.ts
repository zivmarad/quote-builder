'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  completeOnboarding,
  dismissPageHint,
  getSpotlightSeenKey,
  isOnboardingComplete,
  subscribeSpotlight,
  type SpotlightPage,
} from '@/lib/spotlight-onboarding';

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useSpotlightOnboarding() {
  const mounted = useIsClient();
  const isComplete = useSyncExternalStore(
    subscribeSpotlight,
    isOnboardingComplete,
    () => true,
  );
  const seenKey = useSyncExternalStore(
    subscribeSpotlight,
    getSpotlightSeenKey,
    () => '',
  );

  const seenPages = useMemo((): SpotlightPage[] => {
    if (!seenKey) return [];
    return seenKey.split(',').filter(Boolean) as SpotlightPage[];
  }, [seenKey]);

  const isActive = mounted && !isComplete;

  const shouldShow = useCallback(
    (page: SpotlightPage) => isActive && !seenPages.includes(page),
    [isActive, seenPages],
  );

  const dismissPage = useCallback((page: SpotlightPage) => {
    dismissPageHint(page);
  }, []);

  const finish = useCallback(() => {
    completeOnboarding();
  }, []);

  return {
    isActive,
    shouldShow,
    dismissPage,
    complete: finish,
  };
}

'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  completeOnboarding,
  dismissPageHint,
  getSpotlightSnapshot,
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
  const snapshot = useSyncExternalStore(
    subscribeSpotlight,
    getSpotlightSnapshot,
    () => ({ complete: true, seenPages: [] as SpotlightPage[] }),
  );

  const isActive = mounted && !snapshot.complete;

  const shouldShow = useCallback(
    (page: SpotlightPage) => isActive && !snapshot.seenPages.includes(page),
    [isActive, snapshot.seenPages],
  );

  const dismissPage = useCallback(
    (page: SpotlightPage) => {
      dismissPageHint(page);
    },
    [],
  );

  const complete = useCallback(() => {
    completeOnboarding();
  }, []);

  return {
    isActive,
    shouldShow,
    dismissPage,
    complete,
  };
}

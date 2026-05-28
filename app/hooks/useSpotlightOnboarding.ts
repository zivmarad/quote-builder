'use client';

import { useSyncExternalStore } from 'react';
import {
  advanceSpotlightStep,
  getSpotlightStep,
  skipSpotlightOnboarding,
  subscribeSpotlight,
  type SpotlightStep,
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
  const storedStep = useSyncExternalStore(
    subscribeSpotlight,
    getSpotlightStep,
    (): SpotlightStep => 'done',
  );
  const step = mounted ? storedStep : 'done';

  return {
    step,
    isActive: step !== 'done',
    advance: advanceSpotlightStep,
    skip: skipSpotlightOnboarding,
  };
}

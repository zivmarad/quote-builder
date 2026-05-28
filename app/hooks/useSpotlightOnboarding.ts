'use client';

import { useSyncExternalStore } from 'react';
import {
  advanceSpotlightStep,
  getSpotlightStep,
  skipSpotlightOnboarding,
  subscribeSpotlight,
  type SpotlightStep,
} from '@/lib/spotlight-onboarding';

export function useSpotlightOnboarding() {
  const step = useSyncExternalStore(subscribeSpotlight, getSpotlightStep, (): SpotlightStep => 'done');

  return {
    step,
    isActive: step !== 'done',
    advance: advanceSpotlightStep,
    skip: skipSpotlightOnboarding,
  };
}

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchSync, postSync } from '../../lib/sync';
import {
  type ServicePriceOverride,
  parseOverridesStorage,
  serializeOverridesStorage,
  getOverrideBasePrice,
  getOverrideQuestionValue,
} from '../../lib/price-overrides-utils';

const getStorageKey = (userId: string | null | undefined) =>
  `quoteBuilder_priceOverrides_${userId ?? 'guest'}`;

interface PriceOverridesContextType {
  getBasePrice: (serviceId: string, defaultPrice: number) => number;
  getImpactValue: (serviceId: string, questionId: string, defaultValue: number) => number;
  setBasePrice: (serviceId: string, price: number | '') => void;
  setQuestionImpact: (serviceId: string, questionId: string, value: number | '') => void;
  getAllOverrides: () => Record<string, ServicePriceOverride>;
  setOverrides: (map: Record<string, ServicePriceOverride>) => void;
  isLoaded: boolean;
}

const PriceOverridesContext = createContext<PriceOverridesContextType | undefined>(undefined);

export function PriceOverridesProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string | null;
}) {
  const [overrides, setOverridesState] = useState<Record<string, ServicePriceOverride>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const lastLoadedForUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const key = getStorageKey(userId);
    const loadFromStorage = (): Record<string, ServicePriceOverride> => {
      const raw = localStorage.getItem(key);
      if (!raw) return {};
      try {
        return parseOverridesStorage(JSON.parse(raw));
      } catch {
        return {};
      }
    };

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setIsLoaded(false);
      lastLoadedForUserIdRef.current = undefined;
      if (userId) {
        const data = await fetchSync<{ overrides: Record<string, unknown> }>('/price-overrides', userId);
        if (!cancelled && data?.overrides && typeof data.overrides === 'object') {
          const parsed = parseOverridesStorage(data.overrides);
          lastLoadedForUserIdRef.current = userId;
          setOverridesState(parsed);
          localStorage.setItem(key, JSON.stringify(serializeOverridesStorage(parsed)));
          setIsLoaded(true);
          return;
        }
      }
      if (!cancelled) {
        lastLoadedForUserIdRef.current = userId;
        setOverridesState(loadFromStorage());
      }
      setIsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      const key = getStorageKey(userId);
      const serialized = serializeOverridesStorage(overrides);
      localStorage.setItem(key, JSON.stringify(serialized));
      if (userId && lastLoadedForUserIdRef.current === userId) {
        void postSync('/price-overrides', userId, { overrides: serialized });
      }
    } catch { /* ignore quota / private mode */ }
  }, [overrides, isLoaded, userId]);

  const getBasePrice = useCallback(
    (serviceId: string, defaultPrice: number) =>
      getOverrideBasePrice(overrides[serviceId], defaultPrice),
    [overrides]
  );

  const getImpactValue = useCallback(
    (serviceId: string, questionId: string, defaultValue: number) =>
      getOverrideQuestionValue(overrides[serviceId], questionId, defaultValue),
    [overrides]
  );

  const setBasePrice = useCallback((serviceId: string, price: number | '') => {
    setOverridesState((prev) => {
      const next = { ...prev };
      const current = { ...(next[serviceId] ?? {}) };
      if (price === '' || (typeof price === 'number' && price < 0)) {
        delete current.basePrice;
      } else if (typeof price === 'number') {
        current.basePrice = price;
      }
      if (current.basePrice == null && (!current.questions || Object.keys(current.questions).length === 0)) {
        delete next[serviceId];
      } else {
        next[serviceId] = current;
      }
      return next;
    });
  }, []);

  const setQuestionImpact = useCallback((serviceId: string, questionId: string, value: number | '') => {
    setOverridesState((prev) => {
      const next = { ...prev };
      const current = { ...(next[serviceId] ?? {}) };
      const questions = { ...(current.questions ?? {}) };
      if (value === '') {
        delete questions[questionId];
      } else {
        questions[questionId] = value;
      }
      if (Object.keys(questions).length > 0) {
        current.questions = questions;
      } else {
        delete current.questions;
      }
      if (current.basePrice == null && !current.questions) {
        delete next[serviceId];
      } else {
        next[serviceId] = current;
      }
      return next;
    });
  }, []);

  const getAllOverrides = useCallback(() => ({ ...overrides }), [overrides]);

  const setOverrides = useCallback((map: Record<string, ServicePriceOverride>) => {
    setOverridesState({ ...map });
  }, []);

  return (
    <PriceOverridesContext.Provider
      value={{
        getBasePrice,
        getImpactValue,
        setBasePrice,
        setQuestionImpact,
        getAllOverrides,
        setOverrides,
        isLoaded,
      }}
    >
      {children}
    </PriceOverridesContext.Provider>
  );
}

export function usePriceOverrides() {
  const ctx = useContext(PriceOverridesContext);
  if (ctx === undefined) throw new Error('usePriceOverrides must be used within PriceOverridesProvider');
  return ctx;
}

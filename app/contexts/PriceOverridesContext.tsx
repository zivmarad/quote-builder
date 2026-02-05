'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchSync, postSync } from '../../lib/sync';

const getStorageKey = (userId: string | null | undefined) =>
  `quoteBuilder_priceOverrides_${userId ?? 'guest'}`;

export type PriceOverridesMap = Record<string, number>;

interface PriceOverridesContextType {
  getBasePrice: (serviceId: string, defaultPrice: number) => number;
  setBasePrice: (serviceId: string, price: number | '') => void;
  getAllOverrides: () => PriceOverridesMap;
  setOverrides: (map: PriceOverridesMap) => void;
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
  const [overrides, setOverridesState] = useState<PriceOverridesMap>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const lastLoadedForUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    lastLoadedForUserIdRef.current = undefined;
    let cancelled = false;
    const key = getStorageKey(userId);
    const loadFromStorage = (): PriceOverridesMap => {
      const raw = localStorage.getItem(key);
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw) as Record<string, number>;
        if (!parsed || typeof parsed !== 'object') return {};
        const cleaned: PriceOverridesMap = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'number' && v >= 0) cleaned[k] = v;
        }
        return cleaned;
      } catch {
        return {};
      }
    };

    (async () => {
      if (userId) {
        const data = await fetchSync<{ overrides: Record<string, number> }>('/price-overrides', userId);
        if (!cancelled && data && data.overrides && typeof data.overrides === 'object') {
          const cleaned: PriceOverridesMap = {};
          for (const [k, v] of Object.entries(data.overrides)) {
            if (typeof v === 'number' && v >= 0) cleaned[k] = v;
          }
          lastLoadedForUserIdRef.current = userId;
          setOverridesState(cleaned);
          localStorage.setItem(key, JSON.stringify(cleaned));
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
      localStorage.setItem(key, JSON.stringify(overrides));
      if (userId && lastLoadedForUserIdRef.current === userId) void postSync('/price-overrides', userId, { overrides });
    } catch (_) {}
  }, [overrides, isLoaded, userId]);

  const getBasePrice = useCallback(
    (serviceId: string, defaultPrice: number) => {
      const v = overrides[serviceId];
      return typeof v === 'number' && v >= 0 ? v : defaultPrice;
    },
    [overrides]
  );

  const setBasePrice = useCallback((serviceId: string, price: number | '') => {
    setOverridesState((prev) => {
      const next = { ...prev };
      if (price === '' || (typeof price === 'number' && price < 0)) {
        delete next[serviceId];
      } else if (typeof price === 'number') {
        next[serviceId] = price;
      }
      return next;
    });
  }, []);

  const getAllOverrides = useCallback(() => ({ ...overrides }), [overrides]);

  const setOverrides = useCallback((map: PriceOverridesMap) => {
    const cleaned: PriceOverridesMap = {};
    for (const [k, v] of Object.entries(map)) {
      if (typeof v === 'number' && v >= 0) cleaned[k] = v;
    }
    setOverridesState(cleaned);
  }, []);

  return (
    <PriceOverridesContext.Provider
      value={{ getBasePrice, setBasePrice, getAllOverrides, setOverrides, isLoaded }}
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

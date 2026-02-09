'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchSync, postSync } from '../../lib/sync';

const getStorageKey = (userId: string | null | undefined) =>
  `quoteBuilderSettings_${userId ?? 'guest'}`;

export interface QuoteSettings {
  defaultQuoteTitle: string;
  nextQuoteNumber: number;
  validityDays: number;
  /** 0 = עוסק פטור (ללא מע"מ), 0.18 = מחייב מע"מ 18% */
  vatRate: number;
}

const defaultSettings: QuoteSettings = {
  defaultQuoteTitle: 'הצעת מחיר',
  nextQuoteNumber: 1,
  validityDays: 30,
  vatRate: 0.18,
};

interface SettingsContextType {
  defaultQuoteTitle: string;
  nextQuoteNumber: number;
  validityDays: number;
  vatRate: number;
  setDefaultQuoteTitle: (v: string) => void;
  setNextQuoteNumber: (v: number) => void;
  setValidityDays: (v: number) => void;
  setVatRate: (v: number) => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children, userId }: { children: React.ReactNode; userId?: string | null }) {
  const [settings, setSettings] = useState<QuoteSettings>(defaultSettings);
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
    const loadFromStorage = (): QuoteSettings => {
      let raw = localStorage.getItem(key);
      if (!raw) {
        const legacy = localStorage.getItem('quoteBuilderSettings');
        if (legacy) {
          localStorage.setItem(key, legacy);
          localStorage.removeItem('quoteBuilderSettings');
          raw = legacy;
        }
      }
      if (!raw) return defaultSettings;
      try {
        const parsed = JSON.parse(raw) as Partial<QuoteSettings>;
        const vat = parsed?.vatRate;
        return {
          ...defaultSettings,
          ...parsed,
          nextQuoteNumber: typeof parsed?.nextQuoteNumber === 'number' && parsed.nextQuoteNumber >= 1 ? parsed.nextQuoteNumber : defaultSettings.nextQuoteNumber,
          validityDays: typeof parsed?.validityDays === 'number' && parsed.validityDays >= 1 ? parsed.validityDays : defaultSettings.validityDays,
          vatRate: typeof vat === 'number' && vat >= 0 && vat <= 1 ? vat : defaultSettings.vatRate,
        };
      } catch {
        return defaultSettings;
      }
    };

    (async () => {
      if (userId) {
        const data = await fetchSync<{ settings: Partial<QuoteSettings> }>('/settings', userId);
        if (!cancelled && data && data.settings && typeof data.settings === 'object') {
          const vat = data.settings?.vatRate;
          const merged: QuoteSettings = {
            ...defaultSettings,
            ...data.settings,
            nextQuoteNumber: typeof data.settings.nextQuoteNumber === 'number' && data.settings.nextQuoteNumber >= 1 ? data.settings.nextQuoteNumber : defaultSettings.nextQuoteNumber,
            validityDays: typeof data.settings.validityDays === 'number' && data.settings.validityDays >= 1 ? data.settings.validityDays : defaultSettings.validityDays,
            vatRate: typeof vat === 'number' && vat >= 0 && vat <= 1 ? vat : defaultSettings.vatRate,
          };
          lastLoadedForUserIdRef.current = userId;
          setSettings(merged);
          localStorage.setItem(key, JSON.stringify(merged));
          setIsLoaded(true);
          return;
        }
      }
      if (!cancelled) {
        lastLoadedForUserIdRef.current = userId;
        setSettings(loadFromStorage());
      }
      setIsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(settings));
      if (userId && lastLoadedForUserIdRef.current === userId) void postSync('/settings', userId, { settings });
    } catch (_) {}
  }, [settings, isLoaded, userId]);

  const setDefaultQuoteTitle = useCallback((v: string) => {
    setSettings((prev) => ({ ...prev, defaultQuoteTitle: v }));
  }, []);

  const setNextQuoteNumber = useCallback((v: number) => {
    if (typeof v !== 'number' || v < 1) return;
    setSettings((prev) => ({ ...prev, nextQuoteNumber: v }));
  }, []);

  const setValidityDays = useCallback((v: number) => {
    if (typeof v !== 'number' || v < 1) return;
    setSettings((prev) => ({ ...prev, validityDays: v }));
  }, []);

  const setVatRate = useCallback((v: number) => {
    if (typeof v !== 'number' || v < 0 || v > 1) return;
    setSettings((prev) => ({ ...prev, vatRate: v }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        defaultQuoteTitle: settings.defaultQuoteTitle,
        nextQuoteNumber: settings.nextQuoteNumber,
        validityDays: settings.validityDays,
        vatRate: settings.vatRate,
        setDefaultQuoteTitle,
        setNextQuoteNumber,
        setValidityDays,
        setVatRate,
        isLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (ctx === undefined) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

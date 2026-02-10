'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Locale = 'he' | 'en' | 'ru' | 'ar';

const STORAGE_KEY = 'quoteBuilder_locale';

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const p of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return typeof current === 'string' ? current : undefined;
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Dynamic imports for locale JSON (so we don't bundle all at once if needed)
import he from '../locales/he.json';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import ar from '../locales/ar.json';

const messages: Record<Locale, Record<string, unknown>> = {
  he: he as Record<string, unknown>,
  en: en as Record<string, unknown>,
  ru: ru as Record<string, unknown>,
  ar: ar as Record<string, unknown>,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('he');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && (saved === 'he' || saved === 'en' || saved === 'ru' || saved === 'ar')) {
        setLocaleState(saved);
      }
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch { /* ignore */ }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const current = getNested(messages[locale], key);
      if (current) return current;
      const heFallback = getNested(messages.he, key);
      if (heFallback) return heFallback;
      return fallback ?? key;
    },
    [locale]
  );

  const dir: 'rtl' | 'ltr' = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (ctx === undefined) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

/** Sets document dir and lang when locale changes (client only). Use inside LanguageProvider. */
export function useLanguageDirection() {
  const { locale, dir } = useLanguage();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', locale === 'he' ? 'he' : locale === 'ar' ? 'ar' : locale === 'ru' ? 'ru' : 'en');
  }, [locale, dir]);
}

function LanguageDirectionSync() {
  useLanguageDirection();
  return null;
}

export { LanguageDirectionSync };

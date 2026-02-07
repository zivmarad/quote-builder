'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { BasketItem } from './QuoteBasketContext';
import { fetchSync, postSync } from '../../lib/sync';

const getStorageKey = (userId: string | null | undefined) =>
  `quoteBuilderHistory_${userId ?? 'guest'}`;

/** איך ההצעה יוצאה – הורדה, וואטסאפ, מייל */
export type ExportMethod = 'download' | 'whatsapp' | 'email';

/** סטטוס עסקי להצעה – טיוטה, נשלח, אושר, שולם */
export type QuoteWorkflowStatus = 'draft' | 'sent' | 'approved' | 'paid';

export interface SavedQuote {
  id: string;
  createdAt: string; // ISO
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
  items: BasketItem[];
  totalBeforeVAT: number;
  VAT: number;
  totalWithVAT: number;
  /** מספר ההצעה כפי שהופיע בראש המסמך */
  quoteNumber?: number;
  /** איך ההצעה יוצאה: הורדה, וואטסאפ, מייל */
  status?: ExportMethod;
  /** סטטוס עסקי: טיוטה, נשלח, אושר, שולם */
  quoteStatus?: QuoteWorkflowStatus;
}

interface QuoteHistoryContextType {
  quotes: SavedQuote[];
  addQuote: (quote: Omit<SavedQuote, 'id' | 'createdAt'>) => void;
  deleteQuote: (id: string) => void;
  updateQuoteStatus: (id: string, quoteStatus: QuoteWorkflowStatus) => void;
  getQuote: (id: string) => SavedQuote | undefined;
  isLoaded: boolean;
}

const QuoteHistoryContext = createContext<QuoteHistoryContextType | undefined>(undefined);

export function QuoteHistoryProvider({ children, userId }: { children: React.ReactNode; userId?: string | null }) {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastLoadedForUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    lastLoadedForUserIdRef.current = undefined; // עדיין לא טענו עבור userId הנוכחי
    let cancelled = false;
    const key = getStorageKey(userId);
    const loadFromStorage = (): SavedQuote[] => {
      let raw = localStorage.getItem(key);
      if (!raw) {
        const legacy = localStorage.getItem('quoteBuilderHistory');
        if (legacy) {
          localStorage.setItem(key, legacy);
          localStorage.removeItem('quoteBuilderHistory');
          raw = legacy;
        }
      }
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as SavedQuote[]) : [];
      } catch {
        return [];
      }
    };

    (async () => {
      if (userId) {
        const data = await fetchSync<{ quotes: SavedQuote[] }>('/history', userId);
        if (!cancelled && data && typeof data.quotes !== 'undefined') {
          const arr = Array.isArray(data.quotes) ? data.quotes : [];
          lastLoadedForUserIdRef.current = userId;
          setQuotes(arr);
          localStorage.setItem(key, JSON.stringify(arr));
          setIsLoaded(true);
          return;
        }
      }
      if (!cancelled) {
        lastLoadedForUserIdRef.current = userId;
        setQuotes(loadFromStorage());
      }
      setIsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(quotes));
      // שולחים ל-Supabase רק אם טענו נתונים עבור userId הזה – מונע דריסה בעת רענון
      if (userId && lastLoadedForUserIdRef.current === userId) {
        void postSync('/history', userId, { quotes });
      }
    } catch (e) {
      console.error('Failed to save quote history', e);
    }
  }, [quotes, isLoaded, userId]);

  const addQuote = useCallback((quote: Omit<SavedQuote, 'id' | 'createdAt'>) => {
    const newQuote: SavedQuote = {
      ...quote,
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
    };
    setQuotes((prev) => [newQuote, ...prev]);
  }, []);

  const deleteQuote = useCallback((id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const updateQuoteStatus = useCallback((id: string, quoteStatus: QuoteWorkflowStatus) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, quoteStatus } : q))
    );
  }, []);

  const getQuote = useCallback(
    (id: string) => quotes.find((q) => q.id === id),
    [quotes]
  );

  return (
    <QuoteHistoryContext.Provider
      value={{ quotes, addQuote, deleteQuote, updateQuoteStatus, getQuote, isLoaded }}
    >
      {children}
    </QuoteHistoryContext.Provider>
  );
}

export function useQuoteHistory() {
  const ctx = useContext(QuoteHistoryContext);
  if (ctx === undefined) throw new Error('useQuoteHistory must be used within QuoteHistoryProvider');
  return ctx;
}

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { BasketItem } from './QuoteBasketContext';
import { fetchSync, postSync } from '../../lib/sync';

const getStorageKey = (userId: string | null | undefined) =>
  `quoteBuilderHistory_${userId ?? 'guest'}`;
const getDeletedIdsKey = (userId: string | null | undefined) =>
  `quoteBuilderHistoryDeleted_${userId ?? 'guest'}`;

/** איך ההצעה יוצאה – הורדה, וואטסאפ, מייל */
export type ExportMethod = 'download' | 'whatsapp' | 'email';

/** סטטוס עסקי להצעה – טיוטה, נשלח, אושר, שולם */
export type QuoteWorkflowStatus = 'draft' | 'sent' | 'approved' | 'paid';

export interface QuoteDataSnapshot {
  vatRate: number;
  validityDays: number;
  quoteTitle: string;
  profileBusinessName?: string;
  profileContactName?: string;
  profileCompanyId?: string;
  profilePhone?: string;
  profileEmail?: string;
  profileAddress?: string;
  profileLogo?: string;
  profile: {
    businessName?: string;
    contactName?: string;
    companyId?: string;
    phone?: string;
    email?: string;
    address?: string;
    logo?: string;
  };
  customer: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    companyId?: string;
  };
}

export interface SavedQuote {
  id: string;
  createdAt: string; // ISO
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCompanyId?: string;
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
  /** Snapshot בלתי תלוי בהגדרות עתידיות */
  quoteData: QuoteDataSnapshot;
  /** עותק snake_case לשמירה ב-JSONB */
  quote_data?: QuoteDataSnapshot;
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

function quoteSortDesc(a: SavedQuote, b: SavedQuote): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function normalizeQuote(raw: SavedQuote): SavedQuote {
  const quoteData = raw.quoteData ?? raw.quote_data;
  return {
    ...raw,
    quoteData,
    quote_data: raw.quote_data ?? quoteData,
  };
}

function mergeQuotes(...groups: SavedQuote[][]): SavedQuote[] {
  const byId = new Map<string, SavedQuote>();
  for (const group of groups) {
    for (const raw of group) {
      if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') continue;
      const q = normalizeQuote(raw);
      const existing = byId.get(q.id);
      if (!existing) {
        byId.set(q.id, q);
        continue;
      }
      const nextTs = Date.parse(q.createdAt || '') || 0;
      const prevTs = Date.parse(existing.createdAt || '') || 0;
      byId.set(q.id, nextTs >= prevTs ? q : existing);
    }
  }
  return [...byId.values()].sort(quoteSortDesc);
}

export function QuoteHistoryProvider({ children, userId }: { children: React.ReactNode; userId?: string | null }) {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastLoadedForUserIdRef = useRef<string | null | undefined>(undefined);
  const deletedIdsRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const key = getStorageKey(userId);
    const deletedKey = getDeletedIdsKey(userId);
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
        return Array.isArray(parsed) ? mergeQuotes(parsed as SavedQuote[]) : [];
      } catch {
        return [];
      }
    };

    const loadDeletedIds = (): string[] => {
      const raw = localStorage.getItem(deletedKey);
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
      } catch {
        return [];
      }
    };

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setIsLoaded(false);
      lastLoadedForUserIdRef.current = undefined; // עדיין לא טענו עבור userId הנוכחי
      deletedIdsRef.current = loadDeletedIds();
      if (userId) {
        const guestKey = getStorageKey(null);
        const guestRaw = localStorage.getItem(guestKey);
        const data = await fetchSync<{ quotes: SavedQuote[] }>('/history', userId);
        if (cancelled) return;
        const serverQuotes = data?.quotes != null && Array.isArray(data.quotes) ? data.quotes : [];
        let guestQuotes: SavedQuote[] = [];
        if (guestRaw) {
          try {
            const parsed = JSON.parse(guestRaw) as unknown;
            guestQuotes = Array.isArray(parsed) ? mergeQuotes(parsed as SavedQuote[]) : [];
          } catch {
            /* ignore */
          }
        }
        const merged = mergeQuotes(serverQuotes, guestQuotes);
        const deleted = new Set(deletedIdsRef.current);
        const filtered = deleted.size ? merged.filter((q) => !deleted.has(q.id)) : merged;
        lastLoadedForUserIdRef.current = userId;
        setQuotes(filtered);
        localStorage.setItem(key, JSON.stringify(filtered));
        if (guestRaw) {
          localStorage.removeItem(guestKey);
          void postSync('/history', userId, { quotes: filtered, deletedQuoteIds: deletedIdsRef.current });
        }
        setIsLoaded(true);
        return;
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
      const deletedKey = getDeletedIdsKey(userId);
      localStorage.setItem(key, JSON.stringify(quotes));
      localStorage.setItem(deletedKey, JSON.stringify(deletedIdsRef.current));
      // שולחים ל-Supabase רק אם טענו נתונים עבור userId הזה – מונע דריסה בעת רענון
      if (userId && lastLoadedForUserIdRef.current === userId) {
        const deletedQuoteIds = [...deletedIdsRef.current];
        void postSync('/history', userId, { quotes, deletedQuoteIds }).then((ok) => {
          if (ok && deletedQuoteIds.length) {
            deletedIdsRef.current = deletedIdsRef.current.filter((id) => !deletedQuoteIds.includes(id));
            localStorage.setItem(deletedKey, JSON.stringify(deletedIdsRef.current));
          }
        });
      }
    } catch (e) {
      console.error('Failed to save quote history', e);
    }
  }, [quotes, isLoaded, userId]);

  const addQuote = useCallback((quote: Omit<SavedQuote, 'id' | 'createdAt'>) => {
    const newQuote: SavedQuote = {
      ...quote,
      quote_data: quote.quote_data ?? quote.quoteData,
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
    };
    setQuotes((prev) => mergeQuotes([newQuote], prev));
  }, []);

  const deleteQuote = useCallback((id: string) => {
    if (!deletedIdsRef.current.includes(id)) deletedIdsRef.current.push(id);
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

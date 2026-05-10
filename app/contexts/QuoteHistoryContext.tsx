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
  const pendingUpsertsRef = useRef<SavedQuote[]>([]);
  const syncInFlightRef = useRef(false);

  const queueUpsert = useCallback((quote: SavedQuote) => {
    const normalized = normalizeQuote(quote);
    const idx = pendingUpsertsRef.current.findIndex((q) => q.id === normalized.id);
    if (idx >= 0) pendingUpsertsRef.current[idx] = normalized;
    else pendingUpsertsRef.current.push(normalized);
  }, []);

  const flushSync = useCallback(async () => {
    if (!userId || lastLoadedForUserIdRef.current !== userId) return;
    if (syncInFlightRef.current) return;
    const deletedSnapshot = [...deletedIdsRef.current];
    const upsertsSnapshot = [...pendingUpsertsRef.current];
    if (!deletedSnapshot.length && !upsertsSnapshot.length) return;
    syncInFlightRef.current = true;
    try {
      // Small batches avoid payload spikes and keep sync reliable.
      const chunkSize = 15;
      for (let i = 0; i < upsertsSnapshot.length; i += chunkSize) {
        const chunk = upsertsSnapshot.slice(i, i + chunkSize);
        const ok = await postSync('/history', userId, { quotes: chunk, deletedQuoteIds: i === 0 ? deletedSnapshot : [] });
        if (!ok) return;
      }
      if (!upsertsSnapshot.length && deletedSnapshot.length) {
        const ok = await postSync('/history', userId, { quotes: [], deletedQuoteIds: deletedSnapshot });
        if (!ok) return;
      }
      if (deletedSnapshot.length) {
        const deletedSet = new Set(deletedSnapshot);
        deletedIdsRef.current = deletedIdsRef.current.filter((id) => !deletedSet.has(id));
      }
      if (upsertsSnapshot.length) {
        const sent = new Set(upsertsSnapshot.map((q) => q.id));
        pendingUpsertsRef.current = pendingUpsertsRef.current.filter((q) => !sent.has(q.id));
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(getDeletedIdsKey(userId), JSON.stringify(deletedIdsRef.current));
      }
    } finally {
      syncInFlightRef.current = false;
    }
  }, [userId]);

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
        const localUserQuotes = loadFromStorage();
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
        const merged = mergeQuotes(serverQuotes, localUserQuotes, guestQuotes);
        const deleted = new Set(deletedIdsRef.current);
        const filtered = deleted.size ? merged.filter((q) => !deleted.has(q.id)) : merged;
        lastLoadedForUserIdRef.current = userId;
        setQuotes(filtered);
        localStorage.setItem(key, JSON.stringify(filtered));
        if (guestRaw || filtered.length !== serverQuotes.length) {
          localStorage.removeItem(guestKey);
          const serverById = new Map<string, SavedQuote>();
          for (const q of serverQuotes) serverById.set(q.id, q);
          const deltaUpserts = filtered.filter((q) => {
            const s = serverById.get(q.id);
            if (!s) return true;
            return (Date.parse(q.createdAt || '') || 0) > (Date.parse(s.createdAt || '') || 0);
          });
          if (deltaUpserts.length || deletedIdsRef.current.length) {
            deltaUpserts.forEach(queueUpsert);
            void flushSync();
          }
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
  }, [userId, queueUpsert, flushSync]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      const key = getStorageKey(userId);
      const deletedKey = getDeletedIdsKey(userId);
      localStorage.setItem(key, JSON.stringify(quotes));
      localStorage.setItem(deletedKey, JSON.stringify(deletedIdsRef.current));
      void flushSync();
    } catch (e) {
      console.error('Failed to save quote history', e);
      // Even if localStorage quota fails, keep retrying server sync.
      void flushSync();
    }
  }, [quotes, isLoaded, userId, flushSync]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    const timer = window.setInterval(() => {
      if (pendingUpsertsRef.current.length || deletedIdsRef.current.length) {
        void flushSync();
      }
    }, 10000);
    return () => window.clearInterval(timer);
  }, [isLoaded, userId, flushSync]);

  const addQuote = useCallback((quote: Omit<SavedQuote, 'id' | 'createdAt'>) => {
    const newQuote: SavedQuote = {
      ...quote,
      quote_data: quote.quote_data ?? quote.quoteData,
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
    };
    queueUpsert(newQuote);
    setQuotes((prev) => mergeQuotes([newQuote], prev));
  }, [queueUpsert]);

  const deleteQuote = useCallback((id: string) => {
    if (!deletedIdsRef.current.includes(id)) deletedIdsRef.current.push(id);
    pendingUpsertsRef.current = pendingUpsertsRef.current.filter((q) => q.id !== id);
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const updateQuoteStatus = useCallback((id: string, quoteStatus: QuoteWorkflowStatus) => {
    setQuotes((prev) => {
      const next = prev.map((q) => (q.id === id ? { ...q, quoteStatus } : q));
      const updated = next.find((q) => q.id === id);
      if (updated) queueUpsert(updated);
      return next;
    });
  }, [queueUpsert]);

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

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { BasketItem, QuoteDiscount } from './QuoteBasketContext';
import { fetchSync, postSync } from '../../lib/sync';

const getStorageKey = (userId: string | null | undefined) =>
  `quoteBuilderHistory_${userId ?? 'guest'}`;
const getPendingDeletesKey = (userId: string | null | undefined) =>
  `quoteBuilderHistoryPendingDeletes_${userId ?? 'guest'}`;

function loadPendingDeleteIds(userId: string | null | undefined): Set<string> {
  if (typeof window === 'undefined' || !userId) return new Set();
  try {
    const raw = localStorage.getItem(getPendingDeletesKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function persistPendingDeleteIds(userId: string | null | undefined, ids: Set<string>) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(getPendingDeletesKey(userId), JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

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
  subtotalBeforeDiscount?: number;
  discountAmount?: number;
  discount?: QuoteDiscount;
  totalBeforeVAT: number;
  VAT: number;
  totalWithVAT: number;
  quoteNumber?: number;
  status?: ExportMethod;
  quoteStatus?: QuoteWorkflowStatus;
  /** snapshot; ייתכן חסר בהצעות ישנות מהמיגרציה */
  quoteData?: QuoteDataSnapshot;
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

function newQuoteId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `q-${crypto.randomUUID()}`;
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function quoteSortDesc(a: SavedQuote, b: SavedQuote): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

const defaultQuoteSnapshot: QuoteDataSnapshot = {
  vatRate: 0.18,
  validityDays: 30,
  quoteTitle: 'הצעת מחיר',
  profile: {},
  customer: {},
};

function normalizeQuote(raw: SavedQuote): SavedQuote {
  const quoteData = raw.quoteData ?? raw.quote_data ?? defaultQuoteSnapshot;
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
  /** מחיקות שממתינות לאישור שרת — מסתירות מהממשק עד שהשורה נמחקה ב־Supabase */
  const pendingServerDeleteIdsRef = useRef<Set<string>>(new Set());
  const pendingUpsertsRef = useRef<Map<string, SavedQuote>>(new Map());

  const saveQuoteRemote = useCallback(
    async (quote: SavedQuote): Promise<boolean> => {
      if (!userId || lastLoadedForUserIdRef.current !== userId) return false;
      return postSync('/history', userId, { quote: normalizeQuote(quote) });
    },
    [userId]
  );

  const deleteQuoteRemote = useCallback(
    async (id: string): Promise<boolean> => {
      if (!userId || lastLoadedForUserIdRef.current !== userId) return false;
      return postSync('/history', userId, { deleteQuoteId: id });
    },
    [userId]
  );

  const flushPending = useCallback(async () => {
    if (!userId || lastLoadedForUserIdRef.current !== userId) return;
    for (const id of [...pendingServerDeleteIdsRef.current]) {
      const ok = await deleteQuoteRemote(id);
      if (ok) {
        pendingServerDeleteIdsRef.current.delete(id);
        persistPendingDeleteIds(userId, pendingServerDeleteIdsRef.current);
      }
    }
    for (const [id, q] of [...pendingUpsertsRef.current.entries()]) {
      const ok = await saveQuoteRemote(q);
      if (ok) pendingUpsertsRef.current.delete(id);
    }
  }, [userId, saveQuoteRemote, deleteQuoteRemote]);

  useEffect(() => {
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
        return Array.isArray(parsed) ? mergeQuotes(parsed as SavedQuote[]) : [];
      } catch {
        return [];
      }
    };

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setIsLoaded(false);
      lastLoadedForUserIdRef.current = undefined;
      pendingUpsertsRef.current = new Map();

      if (userId) {
        pendingServerDeleteIdsRef.current = loadPendingDeleteIds(userId);
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
        const tomb = pendingServerDeleteIdsRef.current;
        const visible = merged.filter((q) => !tomb.has(q.id));
        lastLoadedForUserIdRef.current = userId;
        setQuotes(visible);
        localStorage.setItem(key, JSON.stringify(visible));
        if (guestRaw) localStorage.removeItem(guestKey);

        for (const id of [...tomb]) {
          const ok = await deleteQuoteRemote(id);
          if (ok) {
            tomb.delete(id);
            persistPendingDeleteIds(userId, tomb);
          }
        }

        const serverIds = new Set(serverQuotes.map((q) => q.id));
        for (const q of visible) {
          if (!serverIds.has(q.id)) {
            const ok = await saveQuoteRemote(q);
            if (!ok) pendingUpsertsRef.current.set(q.id, normalizeQuote(q));
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
    return () => {
      cancelled = true;
    };
  }, [userId, saveQuoteRemote, deleteQuoteRemote]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(quotes));
    } catch (e) {
      console.error('Failed to save quote history', e);
    }
  }, [quotes, isLoaded, userId]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    const timer = window.setInterval(() => {
      void flushPending();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [isLoaded, userId, flushPending]);

  const addQuote = useCallback(
    (quote: Omit<SavedQuote, 'id' | 'createdAt'>) => {
      const newQuote: SavedQuote = {
        ...quote,
        quote_data: quote.quote_data ?? quote.quoteData,
        id: newQuoteId(),
        createdAt: new Date().toISOString(),
      };
      const normalized = normalizeQuote(newQuote);
      setQuotes((prev) => mergeQuotes([normalized], prev));
      void (async () => {
        const ok = await saveQuoteRemote(normalized);
        if (!ok) pendingUpsertsRef.current.set(normalized.id, normalized);
        else pendingUpsertsRef.current.delete(normalized.id);
      })();
    },
    [saveQuoteRemote]
  );

  const deleteQuote = useCallback(
    (id: string) => {
      pendingUpsertsRef.current.delete(id);
      pendingServerDeleteIdsRef.current.add(id);
      if (userId) persistPendingDeleteIds(userId, pendingServerDeleteIdsRef.current);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      void (async () => {
        const ok = await deleteQuoteRemote(id);
        if (ok) {
          pendingServerDeleteIdsRef.current.delete(id);
          if (userId) persistPendingDeleteIds(userId, pendingServerDeleteIdsRef.current);
        }
      })();
    },
    [deleteQuoteRemote, userId]
  );

  const updateQuoteStatus = useCallback(
    (id: string, quoteStatus: QuoteWorkflowStatus) => {
      setQuotes((prev) => {
        const next = prev.map((q) => (q.id === id ? { ...q, quoteStatus } : q));
        const updated = next.find((q) => q.id === id);
        if (updated) {
          const normalized = normalizeQuote(updated);
          void (async () => {
            const ok = await saveQuoteRemote(normalized);
            if (!ok) pendingUpsertsRef.current.set(id, normalized);
            else pendingUpsertsRef.current.delete(id);
          })();
        }
        return next;
      });
    },
    [saveQuoteRemote]
  );

  const getQuote = useCallback((id: string) => quotes.find((q) => q.id === id), [quotes]);

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

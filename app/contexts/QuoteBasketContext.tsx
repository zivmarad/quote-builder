'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { fetchSync, postSync } from '../../lib/sync';
import { useSettings } from './SettingsContext';
import {
  basketStorageSet,
  basketStorageRemove,
  getBasketWithMigration,
} from '../../lib/basket-storage';
import {
  calculateQuoteTotals,
  type QuoteDiscount,
} from '../../lib/quote-discount';

export type { QuoteDiscount } from '../../lib/quote-discount';

interface BasketPersisted {
  items: BasketItem[];
  discount?: QuoteDiscount | null;
}

function parseBasketPersisted(raw: string | null): BasketPersisted {
  if (!raw) return { items: [] };
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { items: parsed };
    if (parsed && Array.isArray(parsed.items)) {
      return {
        items: parsed.items,
        discount: parsed.discount ?? null,
      };
    }
  } catch {
    /* ignore */
  }
  return { items: [] };
}

function serializeBasket(items: BasketItem[], discount: QuoteDiscount | null): string {
  if (!discount || discount.value <= 0) {
    return JSON.stringify({ items });
  }
  return JSON.stringify({ items, discount });
}

// הגדרת מבנה התוספת (שם ומחיר)
export interface BasketExtra {
  text: string;
  price: number;
}

export interface BasketItem {
  id: string;
  name: string;
  category: string;
  basePrice: number; // מחיר הבסיס של השירות (כולל כמות – basePrice×qty)
  extras?: BasketExtra[]; // רשימת התוספות המפורטת
  overridePrice?: number; // מחיר סופי ידני (אם נערך)
  description?: string;
  quantity?: number; // כמות (למשל 2 אסלות)
  unit?: string; // יחידה (אסלה, חדר, וכו')
}

interface QuoteBasketContextType {
  items: BasketItem[];
  addItem: (item: Omit<BasketItem, 'id'>) => void;
  removeItem: (id: string) => void;
  /** הסרת תת־שירות (תוספת) מפריט */
  removeExtraFromItem: (itemId: string, extraIndex: number) => void;
  updateItemPrice: (id: string, newPrice: number) => void;
  /** החזרה לברירת מחדל – מחיר מחושב (בסיס + תוספות) */
  clearItemPriceOverride: (id: string) => void;
  clearBasket: () => void;
  /** טוען פריטים לסל (שכפול הצעה) – נותן לכל פריט id חדש */
  loadBasket: (items: BasketItem[], discount?: QuoteDiscount | null) => void;
  /** מסדר מחדש את פריטי הסל (גרירה למעלה/למטה) */
  reorderItems: (newItems: BasketItem[]) => void;
  discount: QuoteDiscount | null;
  setDiscount: (discount: QuoteDiscount | null) => void;
  subtotalBeforeDiscount: number;
  discountAmount: number;
  totalBeforeVAT: number;
  VAT: number;
  totalWithVAT: number;
  itemCount: number;
  isLoaded: boolean;
}

const QuoteBasketContext = createContext<QuoteBasketContextType | undefined>(undefined);

const getStorageKey = (userId: string | null | undefined) =>
  `quoteBasket_${userId ?? 'guest'}`;

/** שם האירוע כשמגיעים למגבלת אחסון (IndexedDB) */
export const STORAGE_QUOTA_EVENT = 'quoteBasketStorageQuotaExceeded';

export const QuoteBasketProvider: React.FC<{ children: React.ReactNode; userId?: string | null }> = ({ children, userId }) => {
  const { vatRate } = useSettings();
  const [items, setItems] = useState<BasketItem[]>([]);
  const [discount, setDiscountState] = useState<QuoteDiscount | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastLoadedForUserIdRef = useRef<string | null | undefined>(undefined);

  // טעינה: משתמש מחובר – קודם מ־Supabase, אחרת IndexedDB. אורח – IndexedDB בלבד
  useEffect(() => {
    let cancelled = false;
    const key = getStorageKey(userId);

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setIsLoaded(false);
      lastLoadedForUserIdRef.current = undefined;
      if (userId) {
        const guestKey = getStorageKey(null);
        const [serverData, guestSaved] = await Promise.all([
          fetchSync<{ items: BasketItem[] }>('/basket', userId),
          getBasketWithMigration(guestKey, null),
        ]);
        if (cancelled) return;
        const serverItems = serverData?.items != null && Array.isArray(serverData.items) ? serverData.items : [];
        const guestParsed = parseBasketPersisted(guestSaved);
        const guestItems = guestParsed.items;
        const merged = [...serverItems, ...guestItems];
        lastLoadedForUserIdRef.current = userId;
        setItems(merged);
        setDiscountState(guestParsed.discount ?? null);
        if (merged.length > 0) {
          void basketStorageSet(key, serializeBasket(merged, guestParsed.discount ?? null));
          void postSync('/basket', userId, { items: merged });
        }
        void basketStorageRemove(guestKey);
        setIsLoaded(true);
        return;
      }
      const savedBasket = await getBasketWithMigration(key, userId ?? null);
      if (cancelled) return;
      lastLoadedForUserIdRef.current = userId;
      const parsed = parseBasketPersisted(savedBasket);
      setItems(parsed.items);
      setDiscountState(parsed.discount ?? null);
      setIsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // שמירה: IndexedDB תמיד; Supabase רק אם טענו עבור userId הזה
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return;
    const key = getStorageKey(userId);
    if (items.length > 0) {
      void basketStorageSet(key, serializeBasket(items, discount));
      if (userId && lastLoadedForUserIdRef.current === userId) void postSync('/basket', userId, { items });
    } else {
      void basketStorageRemove(key);
      if (userId && lastLoadedForUserIdRef.current === userId) void postSync('/basket', userId, { items: [] });
    }
  }, [items, discount, isLoaded, userId]);

  const addItem = (item: Omit<BasketItem, 'id'>) => {
    const newItem: BasketItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const removeExtraFromItem = (itemId: string, extraIndex: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId || !item.extras?.length) return item;
        const newExtras = item.extras.filter((_, i) => i !== extraIndex);
        return { ...item, extras: newExtras, overridePrice: undefined };
      })
    );
  };

  const updateItemPrice = (id: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, overridePrice: newPrice } : item
      )
    );
  };

  const clearItemPriceOverride = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, overridePrice: undefined } : item
      )
    );
  };

  const clearBasket = () => {
    setItems([]);
    setDiscountState(null);
  };

  const setDiscount = (next: QuoteDiscount | null) => {
    if (!next || next.value <= 0) {
      setDiscountState(null);
      return;
    }
    setDiscountState(next);
  };

  const reorderItems = (newItems: BasketItem[]) => {
    setItems(newItems);
  };

  const loadBasket = (newItems: BasketItem[], nextDiscount?: QuoteDiscount | null) => {
    setItems(
      newItems.map((item) => ({
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      }))
    );
    setDiscountState(nextDiscount && nextDiscount.value > 0 ? nextDiscount : null);
  };

  const subtotalBeforeDiscount = items.reduce((sum, item) => {
    if (item.overridePrice !== undefined) return sum + item.overridePrice;
    const extrasTotal = item.extras?.reduce((s, e) => s + (e.price || 0), 0) || 0;
    return sum + (item.basePrice || 0) + extrasTotal;
  }, 0);

  const { discountAmount, totalBeforeVAT, VAT, totalWithVAT } = calculateQuoteTotals(
    subtotalBeforeDiscount,
    vatRate,
    discount
  );
  const itemCount = items.length;

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      removeExtraFromItem,
      updateItemPrice,
      clearItemPriceOverride,
      clearBasket,
      loadBasket,
      reorderItems,
      discount,
      setDiscount,
      subtotalBeforeDiscount,
      discountAmount,
      totalBeforeVAT,
      VAT,
      totalWithVAT,
      itemCount,
      isLoaded,
    }),
    [
      items,
      discount,
      subtotalBeforeDiscount,
      discountAmount,
      totalBeforeVAT,
      VAT,
      totalWithVAT,
      itemCount,
      isLoaded,
    ]
  );

  return (
    <QuoteBasketContext.Provider value={value}>
      {children}
    </QuoteBasketContext.Provider>
  );
};

export const useQuoteBasket = () => {
  const context = useContext(QuoteBasketContext);
  if (context === undefined) {
    throw new Error('useQuoteBasket must be used within a QuoteBasketProvider');
  }
  return context;
};
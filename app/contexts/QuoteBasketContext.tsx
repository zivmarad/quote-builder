'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { fetchSync, postSync } from '../../lib/sync';
import {
  basketStorageSet,
  basketStorageRemove,
  getBasketWithMigration,
} from '../../lib/basket-storage';

// הגדרת מבנה התוספת (שם ומחיר)
export interface BasketExtra {
  text: string;
  price: number;
}

export interface BasketItem {
  id: string;
  name: string;
  category: string;
  basePrice: number; // מחיר הבסיס של השירות בלבד
  extras?: BasketExtra[]; // רשימת התוספות המפורטת
  overridePrice?: number; // מחיר סופי ידני (אם נערך)
  description?: string;
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
  loadBasket: (items: BasketItem[]) => void;
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
  const [items, setItems] = useState<BasketItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastLoadedForUserIdRef = useRef<string | null | undefined>(undefined);

  // טעינה: משתמש מחובר – קודם מ־Supabase, אחרת IndexedDB. אורח – IndexedDB בלבד
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    lastLoadedForUserIdRef.current = undefined;
    let cancelled = false;
    const key = getStorageKey(userId);

    (async () => {
      if (userId) {
        const data = await fetchSync<{ items: BasketItem[] }>('/basket', userId);
        if (!cancelled && data && typeof data.items !== 'undefined') {
          const arr = Array.isArray(data.items) ? data.items : [];
          lastLoadedForUserIdRef.current = userId;
          setItems(arr);
          void basketStorageSet(key, JSON.stringify(arr));
          setIsLoaded(true);
          return;
        }
      }
      const savedBasket = await getBasketWithMigration(key, userId ?? null);
      if (cancelled) return;
      lastLoadedForUserIdRef.current = userId;
      try {
        const parsed = savedBasket ? JSON.parse(savedBasket) : [];
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        setItems([]);
      }
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
      void basketStorageSet(key, JSON.stringify(items));
      if (userId && lastLoadedForUserIdRef.current === userId) void postSync('/basket', userId, { items });
    } else {
      void basketStorageRemove(key);
      if (userId && lastLoadedForUserIdRef.current === userId) void postSync('/basket', userId, { items: [] });
    }
  }, [items, isLoaded, userId]);

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
  };

  const loadBasket = (newItems: BasketItem[]) => {
    setItems(
      newItems.map((item) => ({
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      }))
    );
  };

  // חישוב מחירים שתומך בתוספות
  const totalBeforeVAT = items.reduce((sum, item) => {
    // אם יש מחיר ערוך ידנית, נשתמש בו
    if (item.overridePrice !== undefined) return sum + item.overridePrice;

    // אחרת, נחבר את מחיר הבסיס + כל התוספות
    const extrasTotal = item.extras?.reduce((s, e) => s + (e.price || 0), 0) || 0;
    return sum + (item.basePrice || 0) + extrasTotal;
  }, 0);

  // מע"מ מעודכן ל-18% (2026)
  const VAT = totalBeforeVAT * 0.18;
  const totalWithVAT = totalBeforeVAT + VAT;
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
      totalBeforeVAT,
      VAT,
      totalWithVAT,
      itemCount,
      isLoaded,
    }),
    [items, totalBeforeVAT, VAT, totalWithVAT, itemCount, isLoaded]
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
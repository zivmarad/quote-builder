/**
 * אחסון טיוטות הצעות – IndexedDB.
 * כל טיוטה כוללת פריטים ופרטי לקוח.
 */

import type { BasketItem } from '../app/contexts/QuoteBasketContext';
import { basketStorageGet, basketStorageSet } from './basket-storage';

export interface QuoteDraft {
  id: string;
  name: string;
  items: BasketItem[];
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerCompanyId: string;
  notes: string;
  savedAt: string; // ISO
}

const getDraftsKey = (userId: string | null | undefined) =>
  `quoteDrafts_${userId ?? 'guest'}`;

export async function getDrafts(userId: string | null | undefined): Promise<QuoteDraft[]> {
  const key = getDraftsKey(userId);
  const raw = await basketStorageGet(key);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function saveDraft(
  userId: string | null | undefined,
  draft: Omit<QuoteDraft, 'id' | 'savedAt'>
): Promise<QuoteDraft> {
  const key = getDraftsKey(userId);
  const list = await getDrafts(userId);
  const now = new Date().toISOString();
  const newDraft: QuoteDraft = {
    ...draft,
    id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    savedAt: now,
  };
  list.unshift(newDraft);
  // הגבלה ל־20 טיוטות
  const trimmed = list.slice(0, 20);
  await basketStorageSet(key, JSON.stringify(trimmed));
  return newDraft;
}

export async function deleteDraft(
  userId: string | null | undefined,
  draftId: string
): Promise<void> {
  const key = getDraftsKey(userId);
  const list = await getDrafts(userId);
  const filtered = list.filter((d) => d.id !== draftId);
  await basketStorageSet(key, JSON.stringify(filtered));
}

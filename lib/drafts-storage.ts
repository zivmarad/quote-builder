/**
 * אחסון טיוטות הצעות – IndexedDB + סנכרון Supabase (כמו הסל).
 */

import type { BasketItem } from '../app/contexts/QuoteBasketContext';
import { basketStorageGet, basketStorageSet, basketStorageRemove } from './basket-storage';
import { fetchSync, postSync } from './sync';

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

const DRAFT_CAP = 20;

const getDraftsKey = (userId: string | null | undefined) =>
  `quoteDrafts_${userId ?? 'guest'}`;

function mergeDraftLists(...lists: QuoteDraft[][]): QuoteDraft[] {
  const byId = new Map<string, QuoteDraft>();
  for (const list of lists) {
    for (const d of list) {
      if (!d?.id || typeof d.savedAt !== 'string') continue;
      const prev = byId.get(d.id);
      const t = new Date(d.savedAt).getTime();
      if (!prev || t > new Date(prev.savedAt).getTime()) byId.set(d.id, d);
    }
  }
  return [...byId.values()].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

function trimDrafts(list: QuoteDraft[]): QuoteDraft[] {
  return list.slice(0, DRAFT_CAP);
}

async function pushDraftsToServer(userId: string | null | undefined): Promise<void> {
  if (!userId) return;
  const list = await getDrafts(userId);
  void postSync('/drafts', userId, { drafts: list });
}

const draftSyncLocks = new Map<string, Promise<QuoteDraft[]>>();

async function runDraftsSync(userId: string): Promise<QuoteDraft[]> {
  const key = getDraftsKey(userId);
  const guestKey = getDraftsKey(null);

  const [serverResp, localDrafts, guestRaw] = await Promise.all([
    fetchSync<{ drafts: QuoteDraft[] }>('/drafts', userId),
    getDrafts(userId),
    basketStorageGet(guestKey),
  ]);

  let guestDrafts: QuoteDraft[] = [];
  if (guestRaw) {
    try {
      const arr = JSON.parse(guestRaw);
      guestDrafts = Array.isArray(arr) ? arr : [];
    } catch {
      /* ignore */
    }
  }

  const serverDrafts =
    serverResp?.drafts != null && Array.isArray(serverResp.drafts) ? serverResp.drafts : [];
  const merged = trimDrafts(mergeDraftLists(serverDrafts, localDrafts, guestDrafts));

  await basketStorageSet(key, JSON.stringify(merged));
  if (guestDrafts.length > 0) {
    void basketStorageRemove(guestKey);
  }

  void postSync('/drafts', userId, { drafts: merged });
  return merged;
}

/** מיזוג שרת + מקומי + טיוטות אורח; שומר ודוחף לשרת. נקרא בכניסה ובפרופיל. */
export function syncDraftsForLoggedInUser(userId: string): Promise<QuoteDraft[]> {
  const existing = draftSyncLocks.get(userId);
  if (existing) return existing;
  const p = runDraftsSync(userId).finally(() => {
    draftSyncLocks.delete(userId);
  });
  draftSyncLocks.set(userId, p);
  return p;
}

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
  const trimmed = trimDrafts(list);
  await basketStorageSet(key, JSON.stringify(trimmed));
  void pushDraftsToServer(userId ?? null);
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
  void pushDraftsToServer(userId ?? null);
}

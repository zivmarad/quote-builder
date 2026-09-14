import { basketStorageGet, basketStorageRemove, basketStorageSet } from './basket-storage';

export type CartMeta = {
  notes: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerCompanyId: string;
};

const EMPTY_META: CartMeta = {
  notes: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  customerCompanyId: '',
};

const SAVED_NOTES_CAP = 10;

const metaKey = (userId: string | null | undefined) => `quoteCartMeta_${userId ?? 'guest'}`;
const savedNotesKey = (userId: string | null | undefined) => `quoteSavedNotes_${userId ?? 'guest'}`;

function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

function lsRemove(key: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

async function readStored(key: string): Promise<string | null> {
  const fromLs = lsGet(key);
  if (fromLs) return fromLs;
  const fromIdb = await basketStorageGet(key);
  if (fromIdb) {
    lsSet(key, fromIdb);
    return fromIdb;
  }
  return null;
}

async function writeStored(key: string, value: string): Promise<void> {
  lsSet(key, value);
  await basketStorageSet(key, value);
}

async function removeStored(key: string): Promise<void> {
  lsRemove(key);
  await basketStorageRemove(key);
}

function parseMeta(raw: string | null): CartMeta {
  if (!raw) return { ...EMPTY_META };
  try {
    const parsed = JSON.parse(raw) as Partial<CartMeta>;
    return {
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      customerName: typeof parsed.customerName === 'string' ? parsed.customerName : '',
      customerPhone: typeof parsed.customerPhone === 'string' ? parsed.customerPhone : '',
      customerEmail: typeof parsed.customerEmail === 'string' ? parsed.customerEmail : '',
      customerAddress: typeof parsed.customerAddress === 'string' ? parsed.customerAddress : '',
      customerCompanyId: typeof parsed.customerCompanyId === 'string' ? parsed.customerCompanyId : '',
    };
  } catch {
    return { ...EMPTY_META };
  }
}

function metaHasContent(meta: CartMeta): boolean {
  return Object.values(meta).some((v) => v.trim().length > 0);
}

function parseSavedNotes(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((n): n is string => typeof n === 'string' && n.trim().length > 0);
  } catch {
    return [];
  }
}

function mergeSavedNotes(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const note of list) {
      const t = note.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
      if (out.length >= SAVED_NOTES_CAP) return out;
    }
  }
  return out;
}

export async function loadCartMeta(userId: string | null | undefined): Promise<CartMeta> {
  const own = parseMeta(await readStored(metaKey(userId)));
  if (!userId) return own;

  const guest = parseMeta(await readStored(metaKey(null)));
  if (!metaHasContent(guest)) return own;

  const merged: CartMeta = {
    notes: own.notes.trim() ? own.notes : guest.notes,
    customerName: own.customerName.trim() ? own.customerName : guest.customerName,
    customerPhone: own.customerPhone.trim() ? own.customerPhone : guest.customerPhone,
    customerEmail: own.customerEmail.trim() ? own.customerEmail : guest.customerEmail,
    customerAddress: own.customerAddress.trim() ? own.customerAddress : guest.customerAddress,
    customerCompanyId: own.customerCompanyId.trim() ? own.customerCompanyId : guest.customerCompanyId,
  };
  await writeStored(metaKey(userId), JSON.stringify(merged));
  await removeStored(metaKey(null));
  return merged;
}

export async function saveCartMeta(
  userId: string | null | undefined,
  meta: CartMeta,
): Promise<void> {
  const key = metaKey(userId);
  if (!metaHasContent(meta)) {
    await removeStored(key);
    return;
  }
  await writeStored(key, JSON.stringify(meta));
}

export async function loadSavedQuoteNotes(userId: string | null | undefined): Promise<string[]> {
  const own = parseSavedNotes(await readStored(savedNotesKey(userId)));
  if (!userId) return own;

  const guest = parseSavedNotes(await readStored(savedNotesKey(null)));
  if (guest.length === 0) return own;

  const merged = mergeSavedNotes(own, guest);
  await writeStored(savedNotesKey(userId), JSON.stringify(merged));
  await removeStored(savedNotesKey(null));
  return merged;
}

export async function saveQuoteNoteTemplate(
  userId: string | null | undefined,
  note: string,
): Promise<string[]> {
  const trimmed = note.trim();
  if (!trimmed) return loadSavedQuoteNotes(userId);
  const current = await loadSavedQuoteNotes(userId);
  const next = mergeSavedNotes([trimmed], current);
  await writeStored(savedNotesKey(userId), JSON.stringify(next));
  return next;
}

export async function deleteQuoteNoteTemplate(
  userId: string | null | undefined,
  note: string,
): Promise<string[]> {
  const current = await loadSavedQuoteNotes(userId);
  const next = current.filter((n) => n !== note);
  const key = savedNotesKey(userId);
  if (next.length === 0) await removeStored(key);
  else await writeStored(key, JSON.stringify(next));
  return next;
}

/**
 * אחסון הסל – IndexedDB במקום localStorage.
 * IndexedDB יש מכסה הרבה יותר גבוהה (~50MB+) ולכן מאפשר סלים גדולים בלי הגבלה.
 */

const DB_NAME = 'QuoteBasketDB';
const STORE_NAME = 'baskets';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB לא זמין'));
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

export async function basketStorageGet(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const row = req.result;
        resolve(row?.value ?? null);
      };
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function basketStorageSet(key: string, value: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ key, value });
      req.onerror = () => {
        const err = req.error;
        if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
          window.dispatchEvent(new CustomEvent('quoteBasketStorageQuotaExceeded'));
        }
        resolve(false);
      };
      req.onsuccess = () => resolve(true);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return false;
  }
}

export async function basketStorageRemove(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
      tx.oncomplete = () => db.close();
    });
  } catch {
    /* ignore */
  }
}

/** מחזיר נתונים מ-localStorage אם יש (למעבר) – לא מוחק */
function getLegacyFromLocalStorage(key: string, userId: string | null): string | null {
  if (typeof window === 'undefined') return null;
  let v = localStorage.getItem(key);
  if (!v) v = localStorage.getItem('quoteBasket'); // מפתח ישן (לפני per-user)
  return v;
}

/** מעבר מ-localStorage ל-IndexedDB – מריץ פעם אחת כשנמצא נתונים ישנים */
export async function getBasketWithMigration(
  key: string,
  _userId: string | null
): Promise<string | null> {
  let data = await basketStorageGet(key);
  if (data) return data;
  const legacy = getLegacyFromLocalStorage(key, _userId);
  if (legacy) {
    await basketStorageSet(key, legacy);
    localStorage.removeItem(key);
    localStorage.removeItem('quoteBasket');
    return legacy;
  }
  return null;
}

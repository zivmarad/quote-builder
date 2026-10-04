/** התחומים שהמשתמש בחר שיופיעו בבית. null = עוד לא בחר. */

const STORAGE_PREFIX = 'quoteBuilder_tradeInterests_';

export type TradeInterests = {
  ids: string[];
  /** בחר לעבוד בלי קטלוג — הבית נשאר בלי רשימת מקצועות. */
  catalogOff: boolean;
};

/** שמונה תחומים נפוצים. השאר נפתחים רק מ«עוד תחומים». */
export const FEATURED_TRADE_IDS = [
  'paint',
  'plumbing',
  'electricity',
  'tiling',
  'drywall',
  'aluminium',
  'carpentry',
  'gardening',
] as const;

function keyFor(userId: string | null | undefined): string {
  return STORAGE_PREFIX + (userId ?? 'guest');
}

function parse(raw: string | null): TradeInterests | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<TradeInterests>;
    if (!data || !Array.isArray(data.ids)) return null;
    return {
      ids: data.ids.filter((id) => typeof id === 'string' && id.length > 0),
      catalogOff: Boolean(data.catalogOff),
    };
  } catch {
    return null;
  }
}

export function readTradeInterests(userId: string | null | undefined): TradeInterests | null {
  try {
    return parse(localStorage.getItem(keyFor(userId)));
  } catch {
    return null;
  }
}

export function writeTradeInterests(
  userId: string | null | undefined,
  value: TradeInterests,
): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(value));
  } catch {
    /* המסך עדיין עובד בסשן הנוכחי */
  }
}

/** אורח שנרשם שומר את התחומים שכבר בחר. */
export function migrateGuestTradeInterests(userId: string): void {
  try {
    const userKey = keyFor(userId);
    if (localStorage.getItem(userKey)) return;
    const guest = localStorage.getItem(keyFor(null));
    if (guest) localStorage.setItem(userKey, guest);
  } catch {
    /* ignore */
  }
}

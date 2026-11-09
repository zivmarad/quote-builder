const SEEN_KEY = 'quoteBuilder_landingOfferSeen';
const PENDING_KEY = 'quoteBuilder_landingOfferPending';

export const FIRST_QUOTE_CELEBRATION_EVENT = 'quoteBuilder:firstQuoteCelebration';

function seenKey(userId: string): string {
  return `${SEEN_KEY}:${userId}`;
}

/** נפתח פעם אחת למשתמש, אחרי ההורדה או השליחה הראשונה. */
export function armLandingOfferPrompt(userId: string): void {
  if (!userId) return;
  try {
    if (localStorage.getItem(seenKey(userId)) === '1') return;
    sessionStorage.setItem(PENDING_KEY, userId);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(FIRST_QUOTE_CELEBRATION_EVENT));
}

export function landingOfferPromptPending(): boolean {
  try {
    const userId = sessionStorage.getItem(PENDING_KEY);
    if (!userId) return false;
    if (localStorage.getItem(seenKey(userId)) === '1') return false;
    return true;
  } catch {
    return false;
  }
}

export function dismissLandingOfferPrompt(): void {
  try {
    const userId = sessionStorage.getItem(PENDING_KEY);
    if (userId) localStorage.setItem(seenKey(userId), '1');
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* הסגירה עדיין מסתירה את הכרטיס במסך הנוכחי */
  }
}

const SEEN_KEY = 'quoteBuilder_landingOfferSeen';
const PENDING_KEY = 'quoteBuilder_landingOfferPending';

export const FIRST_QUOTE_CELEBRATION_EVENT = 'quoteBuilder:firstQuoteCelebration';

/** נפתח פעם אחת, אחרי ההורדה או השליחה הראשונה. */
export function armLandingOfferPrompt(): void {
  try {
    if (localStorage.getItem(SEEN_KEY) === '1') return;
    sessionStorage.setItem(PENDING_KEY, '1');
  } catch {
    return;
  }
  window.dispatchEvent(new Event(FIRST_QUOTE_CELEBRATION_EVENT));
}

export function landingOfferPromptPending(): boolean {
  try {
    if (localStorage.getItem(SEEN_KEY) === '1') return false;
    return sessionStorage.getItem(PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissLandingOfferPrompt(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* הסגירה עדיין מסתירה את הכרטיס במסך הנוכחי */
  }
}

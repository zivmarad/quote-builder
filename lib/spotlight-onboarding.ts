export type SpotlightPage = 'home' | 'category' | 'service' | 'go-cart';

const DONE_KEY = 'has_seen_onboarding';
const SEEN_PAGES_KEY = 'spotlight_seen_pages';
const CHANGE_EVENT = 'spotlight_onboarding_change';

/** קטגוריה מוצעת בדף הבית (המשתמש יכול לבחור כל קטגוריה) */
export const SPOTLIGHT_SUGGESTED_HOME_CATEGORY_ID = 'plumbing';

function notifySpotlightChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function readSeenPages(): SpotlightPage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SEEN_PAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is SpotlightPage =>
        p === 'home' || p === 'category' || p === 'service' || p === 'go-cart',
    );
  } catch {
    return [];
  }
}

function writeSeenPages(pages: SpotlightPage[]): void {
  try {
    localStorage.setItem(SEEN_PAGES_KEY, JSON.stringify(pages));
  } catch {
    /* ignore */
  }
}

export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(DONE_KEY) === '1';
  } catch {
    return true;
  }
}

function clearLegacySpotlightKeys(): void {
  try {
    localStorage.removeItem('spotlight_onboarding_step');
    localStorage.removeItem('spotlight_onboarding_category');
    localStorage.removeItem('spotlight_onboarding_service');
  } catch {
    /* ignore */
  }
}

export function shouldShowPageHint(page: SpotlightPage): boolean {
  if (typeof window === 'undefined') return false;
  clearLegacySpotlightKeys();
  if (isOnboardingComplete()) return false;
  return !readSeenPages().includes(page);
}

export function dismissPageHint(page: SpotlightPage): void {
  if (typeof window === 'undefined') return;
  if (isOnboardingComplete()) return;
  const seen = readSeenPages();
  if (seen.includes(page)) return;
  writeSeenPages([...seen, page]);
  notifySpotlightChange();
}

export function completeOnboarding(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DONE_KEY, '1');
    localStorage.removeItem(SEEN_PAGES_KEY);
  } catch {
    /* ignore */
  }
  notifySpotlightChange();
}

export function subscribeSpotlight(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(CHANGE_EVENT, onStoreChange);
}

export function getSpotlightSnapshot(): { complete: boolean; seenPages: SpotlightPage[] } {
  return {
    complete: isOnboardingComplete(),
    seenPages: readSeenPages(),
  };
}

export const SPOTLIGHT_TARGET_CLASS =
  'spotlight-target relative z-[53] ring-2 ring-blue-500/80 ring-offset-2 shadow-md shadow-blue-500/15 rounded-[inherit]';

export const SPOTLIGHT_ELEVATED_CLASS = 'spotlight-elevated !z-[53]';

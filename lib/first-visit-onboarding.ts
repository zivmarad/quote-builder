export type OnboardingStep = 'category' | 'pricing' | 'cart';

const COMPLETED_KEY = 'quoteBuilder_firstVisitOnboardingCompleted';
const STEP_KEY = 'quoteBuilder_firstVisitOnboardingStep';

/** מסלול מהיר לדוגמה – צביעת דירה 5 חדרים */
export const ONBOARDING_QUICK_START = {
  categoryId: 'paint',
  serviceId: 'paint-apt-5',
} as const;

/** תחומים מומלצים בכניסה ראשונה */
export const ONBOARDING_FEATURED_CATEGORIES = [
  'paint',
  'plumbing',
  'electricity',
  'drywall',
  'handyman',
] as const;

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(COMPLETED_KEY) === '1';
  } catch {
    return true;
  }
}

export function getStoredOnboardingStep(): OnboardingStep {
  if (typeof window === 'undefined') return 'category';
  try {
    const s = localStorage.getItem(STEP_KEY);
    if (s === 'pricing' || s === 'cart') return s;
  } catch {
    /* ignore */
  }
  return 'category';
}

export function persistOnboardingStep(step: OnboardingStep): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STEP_KEY, step);
  } catch {
    /* ignore */
  }
}

export function completeOnboarding(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMPLETED_KEY, '1');
    localStorage.removeItem(STEP_KEY);
    window.dispatchEvent(new Event('quoteBuilder_onboardingChange'));
  } catch {
    /* ignore */
  }
}

export function subscribeOnboarding(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('quoteBuilder_onboardingChange', onStoreChange);
  return () => window.removeEventListener('quoteBuilder_onboardingChange', onStoreChange);
}

const CART_WELCOME_KEY = 'quoteBuilder_showCartWelcome';

export function isCartWelcomeVisible(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(CART_WELCOME_KEY) === '1';
  } catch {
    return false;
  }
}

export function markShowCartWelcome(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CART_WELCOME_KEY, '1');
    window.dispatchEvent(new Event('quoteBuilder_cartWelcomeChange'));
  } catch {
    /* ignore */
  }
}

export function subscribeCartWelcome(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('quoteBuilder_cartWelcomeChange', onStoreChange);
  return () => window.removeEventListener('quoteBuilder_cartWelcomeChange', onStoreChange);
}

export function isOnboardingActive(): boolean {
  return !isOnboardingCompleted();
}

export function resolveStepFromPathname(pathname: string): OnboardingStep {
  if (pathname === '/cart' || pathname.startsWith('/checkout')) return 'cart';
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'category' && parts.length >= 3) return 'pricing';
  return 'category';
}

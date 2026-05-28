export type SpotlightStep = 'home-category' | 'category-service' | 'pricing-add' | 'go-cart' | 'done';

const DONE_KEY = 'has_seen_onboarding';
const STEP_KEY = 'spotlight_onboarding_step';
const CATEGORY_KEY = 'spotlight_onboarding_category';
const SERVICE_KEY = 'spotlight_onboarding_service';
const CHANGE_EVENT = 'spotlight_onboarding_change';

/** קטגוריה מודגשת בדף הבית */
export const SPOTLIGHT_HOME_CATEGORY_ID = 'plumbing';

export function getSpotlightStep(): SpotlightStep {
  if (typeof window === 'undefined') return 'done';
  try {
    if (localStorage.getItem(DONE_KEY) === '1') return 'done';
    const step = localStorage.getItem(STEP_KEY);
    if (
      step === 'home-category' ||
      step === 'category-service' ||
      step === 'pricing-add' ||
      step === 'go-cart'
    ) {
      return step;
    }
    return 'home-category';
  } catch {
    return 'done';
  }
}

export function getSpotlightCategoryId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CATEGORY_KEY);
  } catch {
    return null;
  }
}

export function getSpotlightServiceId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(SERVICE_KEY);
  } catch {
    return null;
  }
}

function notifySpotlightChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setSpotlightCategoryId(categoryId: string): void {
  try {
    localStorage.setItem(CATEGORY_KEY, categoryId);
  } catch {
    /* ignore */
  }
}

export function setSpotlightServiceId(serviceId: string): void {
  try {
    localStorage.setItem(SERVICE_KEY, serviceId);
  } catch {
    /* ignore */
  }
}

export function advanceSpotlightStep(next: SpotlightStep): void {
  if (typeof window === 'undefined') return;
  try {
    if (next === 'done') {
      localStorage.setItem(DONE_KEY, '1');
      localStorage.removeItem(STEP_KEY);
      localStorage.removeItem(CATEGORY_KEY);
      localStorage.removeItem(SERVICE_KEY);
    } else {
      localStorage.setItem(STEP_KEY, next);
    }
    notifySpotlightChange();
  } catch {
    /* ignore */
  }
}

export function skipSpotlightOnboarding(): void {
  advanceSpotlightStep('done');
}

export function subscribeSpotlight(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(CHANGE_EVENT, onStoreChange);
}

export const SPOTLIGHT_TARGET_CLASS =
  'spotlight-target relative z-[52] ring-2 ring-blue-400/90 ring-offset-2 shadow-lg shadow-blue-500/10';

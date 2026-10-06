type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function ensureListener() {
  if (typeof window === 'undefined') return;
  const w = window as Window & { __qbInstallBound?: boolean };
  if (w.__qbInstallBound) return;
  w.__qbInstallBound = true;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
}

ensureListener();

export function hasNativeInstallPrompt(): boolean {
  ensureListener();
  return deferred != null;
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  ensureListener();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** פותח את חלון ההתקנה של הדפדפן. בלי אירוע — המכשיר לא תומך בהתקנה ישירה. */
export async function promptNativeInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  ensureListener();
  const event = deferred;
  if (!event) return 'unavailable';
  deferred = null;
  emit();
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome;
  } catch {
    return 'unavailable';
  }
}

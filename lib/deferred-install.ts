type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallWindow = Window & {
  __qbInstallBound?: boolean;
  __qbDeferredInstall?: BeforeInstallPromptEvent | null;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function installWindow(): InstallWindow | null {
  if (typeof window === 'undefined') return null;
  return window as InstallWindow;
}

function stashedEvent(): BeforeInstallPromptEvent | null {
  return installWindow()?.__qbDeferredInstall ?? null;
}

function remember(event: BeforeInstallPromptEvent) {
  deferred = event;
  const w = installWindow();
  if (w) w.__qbDeferredInstall = event;
}

function adoptStash() {
  if (deferred) return;
  const event = stashedEvent();
  if (event) deferred = event;
}

function ensureListener() {
  const w = installWindow();
  if (!w) return;
  adoptStash();
  if (w.__qbInstallBound) return;
  w.__qbInstallBound = true;
  window.addEventListener('qb-install-ready', () => {
    adoptStash();
    if (deferred) emit();
  });
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    remember(event as BeforeInstallPromptEvent);
    emit();
  });
}

ensureListener();

export function hasNativeInstallPrompt(): boolean {
  ensureListener();
  return deferred != null || stashedEvent() != null;
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  ensureListener();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function takeEvent(): BeforeInstallPromptEvent | null {
  adoptStash();
  const event = deferred ?? stashedEvent();
  deferred = null;
  const w = installWindow();
  if (w) w.__qbDeferredInstall = null;
  emit();
  return event;
}

/** פותח את חלון ההתקנה של הדפדפן. בלי אירוע — המכשיר לא תומך בהתקנה ישירה. */
export async function promptNativeInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  ensureListener();
  const event = takeEvent();
  if (!event) return 'unavailable';
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome;
  } catch {
    return 'unavailable';
  }
}

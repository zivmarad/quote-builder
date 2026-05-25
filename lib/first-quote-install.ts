const FIRST_QUOTE_KEY = 'quoteBuilder_firstQuoteCompleted';
const SHOW_INSTALL_PROMPT_KEY = 'quoteBuilder_showInstallPrompt';
const INSTALL_PROMPT_DISMISSED_KEY = 'quoteBuilder_installPromptDismissed';

/** מסמן שהושלמה הצעה ראשונה; מפעיל הצגת חלון התקנה בכניסה הבאה לדף. */
export function markFirstQuoteCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem(FIRST_QUOTE_KEY) === '1') return false;
    localStorage.setItem(FIRST_QUOTE_KEY, '1');
    sessionStorage.setItem(SHOW_INSTALL_PROMPT_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

export function shouldShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === '1') return false;
    return sessionStorage.getItem(SHOW_INSTALL_PROMPT_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissInstallPrompt(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SHOW_INSTALL_PROMPT_KEY);
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearInstallPromptSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SHOW_INSTALL_PROMPT_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * לאחר התחברות: לא מפנים חזרה ל־/profile (מרגיש כמו "הגדרות") אלא לדף הבית,
 * למעט זרם onboarding (/welcome) או הרשמה ישנה עם ?newUser=1
 */
export function resolvePostLoginRedirectPath(fromParam: string | null): string {
  const home = '/';
  if (fromParam == null || typeof fromParam !== 'string') return home;
  let p = fromParam.trim();
  if (!p.startsWith('/')) p = `/${p}`;
  const noHash = p.split('#')[0] ?? home;
  if (noHash === '/welcome' || noHash.startsWith('/welcome/')) return noHash;
  if (noHash === '/profile' || noHash.startsWith('/profile/')) {
    const qIndex = noHash.indexOf('?');
    if (qIndex !== -1) {
      try {
        const qs = new URLSearchParams(noHash.slice(qIndex + 1));
        if (qs.get('newUser') === '1') return noHash;
      } catch {
        return home;
      }
    }
    return home;
  }
  return noHash || home;
}

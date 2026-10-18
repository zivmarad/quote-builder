const KEY = 'quoteBuilder_quoteIssuedAt';

function isIsoDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

/** שומר את תאריך ההצעה שנפתחה מההיסטוריה, כדי שהסל לא יחליף אותו בתאריך היום. */
export function rememberQuoteIssuedAt(iso?: string | null) {
  if (typeof window === 'undefined') return;
  if (iso && isIsoDate(iso)) sessionStorage.setItem(KEY, iso);
  else sessionStorage.removeItem(KEY);
}

export function readQuoteIssuedAt(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw || !isIsoDate(raw)) return null;
  return raw;
}

export function forgetQuoteIssuedAt() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}

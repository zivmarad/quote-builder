/** שקל שלם לתצוגה. חצי שקל ומעלה עולה. החישוב המדויק נשאר כמו שהוא. */
export function roundShekel(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
}

/** מספר לתצוגה בהצעה, בלי אגורות. */
export function formatShekel(amount: number): string {
  return roundShekel(amount).toLocaleString('he-IL');
}

/**
 * סכומים שמופיעים בהצעה: כל שורה בשקל שלם, והסיכום הוא סכום השורות המוצגות.
 * לפני מע״מ + מע״מ = סה״כ לתשלום.
 */
export function presentQuoteTotals(input: {
  discountAmount?: number;
  totalBeforeVAT: number;
  VAT: number;
}) {
  const discount = Math.max(0, roundShekel(input.discountAmount ?? 0));
  const before = Math.max(0, roundShekel(input.totalBeforeVAT));
  const vat = Math.max(0, roundShekel(input.VAT));
  return {
    subtotal: before + discount,
    discount,
    before,
    vat,
    total: before + vat,
  };
}

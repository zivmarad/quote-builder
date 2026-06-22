export type DiscountType = 'percent' | 'fixed';

export interface QuoteDiscount {
  type: DiscountType;
  value: number;
}

export function calculateDiscountAmount(subtotal: number, discount: QuoteDiscount | null | undefined): number {
  if (!discount || discount.value <= 0 || subtotal <= 0) return 0;
  if (discount.type === 'percent') {
    const pct = Math.min(100, discount.value);
    return Math.round(subtotal * (pct / 100));
  }
  return Math.min(subtotal, discount.value);
}

export function formatDiscountLabel(discount: QuoteDiscount): string {
  if (discount.type === 'percent') {
    return `הנחה (${discount.value}%)`;
  }
  return 'הנחה';
}

export function calculateQuoteTotals(
  subtotalBeforeDiscount: number,
  vatRate: number,
  discount: QuoteDiscount | null | undefined
) {
  const discountAmount = calculateDiscountAmount(subtotalBeforeDiscount, discount);
  const totalBeforeVAT = Math.max(0, subtotalBeforeDiscount - discountAmount);
  const VAT = totalBeforeVAT * vatRate;
  const totalWithVAT = totalBeforeVAT + VAT;
  return { subtotalBeforeDiscount, discountAmount, totalBeforeVAT, VAT, totalWithVAT };
}

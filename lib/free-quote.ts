type FreeQuoteFields = {
  category: string;
  quantity?: number;
  basePrice: number;
  overridePrice?: number;
};

/** שורות שנכתבות ידנית בהצעה מהירה / פריט חופשי בסל */
export const FREE_QUOTE_CATEGORY = 'פריט חופשי';

export const FREE_QUOTE_UNIT = "יח'";

export function isFreeQuoteItem(item: Pick<FreeQuoteFields, 'category'>): boolean {
  return item.category === FREE_QUOTE_CATEGORY;
}

export function freeQuoteQty(item: Pick<FreeQuoteFields, 'quantity'>): number {
  return item.quantity != null && item.quantity > 0 ? item.quantity : 1;
}

/** מחיר ליחידה – בסל basePrice כבר כולל כמות */
export function freeQuoteUnitPrice(
  item: Pick<FreeQuoteFields, 'basePrice' | 'quantity' | 'overridePrice'>
): number {
  const qty = freeQuoteQty(item);
  const line = item.overridePrice !== undefined ? item.overridePrice : item.basePrice || 0;
  return qty > 0 ? Math.round(line / qty) : 0;
}

export function freeQuoteLineBase(unitPrice: number, qty: number): number {
  const safeQty = qty > 0 ? qty : 1;
  return Math.max(0, Math.round(unitPrice * safeQty));
}

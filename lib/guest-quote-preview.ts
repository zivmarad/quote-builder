import type { QuoteProfile } from '../app/components/utils/pdfExport';

const trim = (s?: string | null) => s?.trim() ?? '';

/** לוגו דוגמה (SVG) לתצוגת תכלית לאורח */
export const GUEST_DEMO_LOGO =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112"><rect width="112" height="112" rx="14" fill="#1e3a5f"/><text x="56" y="64" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="22" font-weight="700">לוגו</text></svg>`
  );

const DEMO_PROFILE: QuoteProfile = {
  businessName: 'יוסי כהן שיפוצים בע״מ',
  contactName: 'יוסי כהן',
  companyId: '515123456',
  phone: '050-1234567',
  email: 'yossi@example.co.il',
  address: 'רחוב הדוגמה 12, תל אביב',
  logo: GUEST_DEMO_LOGO,
};

const DEMO_CUSTOMER = {
  customerName: 'ישראל ישראלי',
  customerPhone: '052-9876543',
  customerEmail: 'israel@example.com',
  customerAddress: 'רחוב הלקוח 5, חולון',
  customerCompanyId: '514987654',
};

const DEMO_NOTES =
  'המחיר לא כולל חומרים. תשלום: 50% מקדמה, יתרה בסיום העבודה.';

export const GUEST_PREVIEW_WATERMARK_LINE = 'תצוגה לדוגמה · הירשם לקבלת הצעה נקייה';
export const GUEST_PREVIEW_WATERMARK_BANNER =
  'תצוגה לדוגמה — הירשם כדי לקבל הצעה נקייה לשליחה ללקוח';

export type CartPreviewInput = {
  items: import('../app/components/utils/pdfExport').BasketItem[];
  subtotalBeforeDiscount?: number;
  discountAmount?: number;
  discount?: import('./quote-discount').QuoteDiscount | null;
  totalBeforeVAT: number;
  totalWithVAT: number;
  profile?: QuoteProfile | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerCompanyId?: string | null;
  notes?: string | null;
  quoteTitle?: string | null;
  quoteNumber?: number | null;
  validityDays?: number | null;
  vatRate?: number;
};

/** ממלא שדות ריקים בדוגמה — רק לאורח; מה שהאורח הקליד נשמר. */
export function buildCartPreviewParams(
  isGuest: boolean,
  input: CartPreviewInput
): CartPreviewInput {
  if (!isGuest) return input;

  const p = input.profile ?? {};
  const mergedProfile: QuoteProfile = {
    businessName: trim(p.businessName) || DEMO_PROFILE.businessName,
    contactName: trim(p.contactName) || DEMO_PROFILE.contactName,
    companyId: trim(p.companyId) || DEMO_PROFILE.companyId,
    phone: trim(p.phone) || DEMO_PROFILE.phone,
    email: trim(p.email) || DEMO_PROFILE.email,
    address: trim(p.address) || DEMO_PROFILE.address,
    logo: trim(p.logo) || DEMO_PROFILE.logo,
  };

  return {
    ...input,
    profile: mergedProfile,
    customerName: trim(input.customerName) || DEMO_CUSTOMER.customerName,
    customerPhone: trim(input.customerPhone) || DEMO_CUSTOMER.customerPhone,
    customerEmail: trim(input.customerEmail) || DEMO_CUSTOMER.customerEmail,
    customerAddress: trim(input.customerAddress) || DEMO_CUSTOMER.customerAddress,
    customerCompanyId: trim(input.customerCompanyId) || DEMO_CUSTOMER.customerCompanyId,
    notes: trim(input.notes) || DEMO_NOTES,
    quoteTitle: trim(input.quoteTitle) || 'הצעת מחיר לשיפוץ כללי',
    quoteNumber: input.quoteNumber != null && input.quoteNumber >= 1 ? input.quoteNumber : 1001,
  };
}

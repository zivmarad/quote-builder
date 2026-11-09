import { buildWhatsAppLink } from './contact-links';

/** דף השירות. בלי מחיר בשורות ההפניה שמחוץ לדף. */
export const CONTRACTOR_LANDING_PATH = '/website';

/** מחיר סופי ללקוח. בלי מע״מ נוסף, ולכן לא כותבים "כולל מע״מ". */
export const CONTRACTOR_LANDING_PRICE = 2490;

/** סבב תיקונים מעבר לשניים שנכללים במחיר. */
export const CONTRACTOR_LANDING_EXTRA_ROUND = 390;

export const CONTRACTOR_LANDING_DAYS = 10;

export function formatOfferShekels(amount: number): string {
  return `${new Intl.NumberFormat('he-IL').format(amount)} ₪`;
}

export const CONTRACTOR_LANDING_WHATSAPP_MESSAGE =
  'היי, ראיתי את הדף על בניית דף נחיתה לעסקים. אשמח לשמוע פרטים.';

export function contractorLandingWhatsAppLink(): string {
  return buildWhatsAppLink(CONTRACTOR_LANDING_WHATSAPP_MESSAGE);
}

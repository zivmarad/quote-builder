export const SUPPORT_PHONE = '0502218880';
export const SUPPORT_PHONE_LINK = 'tel:0502218880';
export const SUPPORT_WHATSAPP_LINK = 'https://wa.me/972502218880';

export function buildWhatsAppLink(message: string): string {
  return `${SUPPORT_WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;
}

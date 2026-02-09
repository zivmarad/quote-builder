import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface BasketItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  overridePrice?: number;
  extras?: Array<{ text: string; price: number }>;
  quantity?: number;
  unit?: string;
}

/** פרופיל בעל המקצוע – מופיע בראש הצעת המחיר */
export interface QuoteProfile {
  businessName?: string;
  contactName?: string;
  companyId?: string; // ח.פ
  phone?: string;
  email?: string;
  address?: string;
  logo?: string; // base64 data URL
}

const formatPrice = (n: number) => '₪' + n.toLocaleString('he-IL');

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** מטהר טקסט תוספת להצגה מקצועית בהצעה – מסיר סימני שאלה ומעבד לפורמט נקי */
const formatExtraForQuote = (text: string): string =>
  text.replace(/\?+$/, '').trim();

const hasProfile = (p?: QuoteProfile | null) =>
  p && (p.businessName || p.phone || p.logo || p.contactName || p.companyId || p.email || p.address);

/** בונה את תוכן ההצעה (פרופיל, לקוח, טבלה, סיכום, הערות) – לשימוש בהדפסה ו-PDF */
function buildQuoteContent(params: {
  items: BasketItem[];
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
}) {
  const { items, totalBeforeVAT, totalWithVAT, profile, customerName, customerPhone, customerEmail, customerAddress, customerCompanyId, notes, quoteTitle, quoteNumber, validityDays, vatRate: rateParam } = params;
  const vatRate = rateParam ?? 0.18;
  const today = new Date().toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const titleText = [quoteTitle?.trim() || 'הצעת מחיר', quoteNumber != null ? `#${quoteNumber}` : ''].filter(Boolean).join(' ');
  const hasCustomer = customerName?.trim() || customerPhone?.trim() || customerEmail?.trim() || customerAddress?.trim() || customerCompanyId?.trim();
  const customerNameVal = customerName?.trim() ?? '—';
  const customerLines: string[] = [];
  if (customerCompanyId?.trim()) customerLines.push(`<span class="client-company-id">ח.פ ${escapeHtml(customerCompanyId.trim())}</span>`);
  if (customerPhone?.trim()) customerLines.push(`<span class="client-phone">${escapeHtml(customerPhone.trim())}</span>`);
  if (customerEmail?.trim()) customerLines.push(`<span class="client-email">${escapeHtml(customerEmail.trim())}</span>`);
  if (customerAddress?.trim()) customerLines.push(`<span class="client-address">${escapeHtml(customerAddress.trim())}</span>`);
  const clientDetails = customerLines.length > 0 ? customerLines.join(' &nbsp; ') : '—';
  const forBlock = `<div class="for-block"><span class="for-label">עבור:</span> <strong>${escapeHtml(customerNameVal)}</strong><br><span class="for-details">${clientDetails}</span></div>`;

  const days = validityDays != null && validityDays >= 1 ? validityDays : 30;
  const validityText = `הצעת מחיר זו תקפה ל-${days} יום מיום הנפקתה`;
  const quoteNumText = quoteNumber != null ? `מס' הצעה: #${quoteNumber}` : '';
  const titleOnly = quoteTitle?.trim() || 'הצעת מחיר לשיפוץ כללי';

  const companyLines: string[] = [];
  if (profile?.businessName) companyLines.push(`<div class="company-name">${escapeHtml(profile.businessName)}</div>`);
  if (profile?.companyId) companyLines.push(`<div class="company-line">ח.פ ${escapeHtml(profile.companyId)}</div>`);
  if (profile?.phone) companyLines.push(`<div class="company-line">${escapeHtml(profile.phone)}</div>`);
  if (profile?.address) companyLines.push(`<div class="company-line">${escapeHtml(profile.address)}</div>`);
  if (profile?.email) companyLines.push(`<div class="company-line">${escapeHtml(profile.email)}</div>`);
  const companyBlock =
    companyLines.length > 0
      ? `<div class="header-company">${companyLines.join('')}</div>`
      : '<div class="header-company"></div>';

  const logoBlock =
    hasProfile(profile) && profile!.logo
      ? `<img src="${profile!.logo}" alt="לוגו" class="header-logo" />`
      : '<div class="header-logo-placeholder">הלוגו שלך</div>';
  const headerTop =
    hasProfile(profile)
      ? `<div class="header-band"></div><div class="header-top"><div class="header-company-wrap">${companyBlock}</div><div class="header-logo-wrap">${logoBlock}</div></div>`
      : '<div class="header-band"></div><div class="header-top"></div>';
  const titleRow = `<div class="title-row"><h1 class="quote-title">${escapeHtml(titleOnly)}</h1><div class="title-meta"><span class="quote-num">${quoteNumText}</span><span class="quote-date">תאריך: ${today}</span></div></div>`;

  const profileBlock = `${headerTop}${titleRow}${forBlock}`;

  const notesText = notes?.trim() ?? '';
  const notesItems = notesText ? notesText.split(/\n/).filter((l) => l.trim()) : [];
  const notesListHtml = notesItems.length > 0
    ? `<ul class="notes-list">${notesItems.map((line) => `<li>${escapeHtml(line.trim())}</li>`).join('')}</ul>`
    : '<div class="notes-content">—</div>';
  const notesBlock = `<div class="notes-section"><div class="notes-title">הערות:</div>${notesListHtml}${validityText ? `<p class="notes-validity">${escapeHtml(validityText)}</p>` : ''}</div>`;

  const businessLabel = hasProfile(profile) && profile!.businessName ? escapeHtml(profile!.businessName) : 'חתימת בעל העסק';
  const footerBlock = `<div class="pdf-footer"><div class="footer-sig-block footer-sig-client"><span class="footer-sig-label">${escapeHtml(customerNameVal)}</span><span class="footer-sig-line"></span></div><div class="footer-sig-block footer-sig-business"><span class="footer-sig-label">${businessLabel}</span><span class="footer-sig-line"></span></div></div>`;

  const VAT = totalBeforeVAT * vatRate;
  return {
    profileBlock,
    notesBlock,
    footerBlock,
    validityText,
    today,
    items,
    totalBeforeVAT,
    VAT,
    totalWithVAT,
  };
}

/** מחזיר HTML מלא לתצוגה מקדימה של הצעת מחיר */
export function getQuotePreviewHtml(params: {
  items: BasketItem[];
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
}): string {
  const content = buildQuoteContent(params);
  const { profileBlock, notesBlock, footerBlock, items: contentItems, VAT } = content;
  const { totalBeforeVAT, totalWithVAT } = params;
  const rate = params.vatRate ?? 0.18;
  const vatLabel = rate === 0 ? 'עוסק פטור' : `מע"מ (${Math.round(rate * 100)}%)`;

  const tableRows = contentItems
    .map((item) => {
      const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
      const calculatedPrice = item.basePrice + extrasTotal;
      const currentPrice = item.overridePrice ?? calculatedPrice;
      const qty = item.quantity ?? 1;
      const pricePerUnit = currentPrice / qty;
      const hasExtras = item.extras && item.extras.length > 0;
      const extrasDesc = hasExtras
        ? item.extras!.map((e) => `• ${escapeHtml(formatExtraForQuote(e.text))}`).join('<br>')
        : '';
      const qtyDisplay = qty > 1 && item.unit ? `${qty} ${item.unit}` : String(qty);
      return `
        <tr>
          <td><div class="item-name">${escapeHtml(item.name)}</div>${extrasDesc ? `<div class="item-extras">${extrasDesc}</div>` : ''}</td>
          <td style="text-align:center">${escapeHtml(qtyDisplay)}</td>
          <td class="price-cell">₪${pricePerUnit.toLocaleString('he-IL')}</td>
          <td class="price-cell">₪${currentPrice.toLocaleString('he-IL')}</td>
        </tr>
      `;
    })
    .join('');

  const previewMobileStyles = `
    @media (max-width: 640px) {
      .quote-preview-body { width: 100% !important; max-width: 100%; padding: 0 12px 12px !important; font-size: 14px !important; }
      .quote-preview-body .container { max-width: 100% !important; }
      .quote-preview-body .quote-title { font-size: 16px !important; }
      .quote-preview-body .items-table { font-size: 12px !important; }
      .quote-preview-body .item-name, .quote-preview-body .item-extras { font-size: 12px !important; }
    }
  `;
  return `
    <style>${getQuoteStyles("'Heebo', 'Assistant', 'Segoe UI', Tahoma, sans-serif")}</style>
    <style>${previewMobileStyles}</style>
    <div class="quote-pdf-body quote-preview-body" dir="rtl">
      <div class="container">
        ${profileBlock}
        <div class="table-summary-wrap">
          <table class="items-table">
            <thead>
              <tr>
                <th>תיאור השירות / המוצר</th>
                <th>יחידות</th>
                <th>מחיר</th>
                <th>סה"כ</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="summary-below">
            <div class="summary">
              <div class="summary-row subtotal"><span>סה"כ</span><span class="amount">₪${totalBeforeVAT.toLocaleString('he-IL')}</span></div>
              <div class="summary-row vat"><span>${vatLabel}</span><span class="amount">₪${VAT.toLocaleString('he-IL')}</span></div>
              <div class="summary-row total"><span>סה"כ לתשלום</span><span class="amount">₪${totalWithVAT.toLocaleString('he-IL')}</span></div>
            </div>
          </div>
        </div>
        ${notesBlock}
      </div>
      ${footerBlock}
    </div>
  `;
}

/** עיצוב מקצועי להצעת מחיר – RTL, Heebo/Assistant, Navy header, טבלה, סיכום צהוב בולט, הערות כרשימה, קווי חתימה. */
function getQuoteStyles(fontFamily = "'Heebo', 'Assistant', 'Segoe UI', Tahoma, sans-serif") {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .quote-pdf-body {
      font-family: ${fontFamily};
      direction: rtl;
      color: #1a1a1a;
      background: #fff;
      padding: 0 20px 20px;
      font-size: 12px;
      line-height: 1.4;
      width: 560px;
    }
    .container { max-width: 560px; margin: 0 auto; }
    .header-band { height: 4px; background: #1e3a5f; margin: 0 -20px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header-top {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
      padding: 10px 0 8px; border-bottom: 1px solid #e0e0e0; margin-bottom: 10px;
    }
    .header-company-wrap { text-align: right; flex: 1; }
    .header-company { font-size: 11px; color: #333; line-height: 1.5; }
    .header-company .company-name { font-weight: 600; font-size: 13px; color: #1a1a1a; margin-bottom: 2px; }
    .header-company .company-line { margin-top: 1px; color: #555; }
    .header-logo-wrap { flex-shrink: 0; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; }
    .header-logo { width: 56px; height: 56px; object-fit: contain; display: block; }
    .header-logo-placeholder {
      width: 56px; height: 56px; background: #f5f5f5; border: 1px solid #ddd;
      display: flex; align-items: center; justify-content: center; font-size: 10px; color: #1e3a5f; font-weight: 600;
    }
    .title-row { margin-bottom: 10px; }
    .quote-title { font-size: 18px; font-weight: 700; color: #1a1a1a; text-align: center; margin-bottom: 6px; letter-spacing: -0.02em; }
    .title-meta { display: flex; justify-content: space-between; font-size: 10px; color: #555; }
    .for-block { margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 11px; color: #333; text-align: right; }
    .for-label { font-weight: 600; color: #1a1a1a; }
    .for-details { font-size: 10px; color: #555; margin-top: 4px; display: block; line-height: 1.5; }
    .table-summary-wrap { display: block; margin-bottom: 12px; }
    .table-summary-wrap .items-table { margin-bottom: 8px; }
    .table-summary-wrap .summary-below { display: flex; justify-content: flex-end; direction: rtl; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; table-layout: fixed; font-size: 11px; }
    .items-table thead th {
      background: #1e3a5f; color: #fff; padding: 8px 10px; text-align: right; font-weight: 600; font-size: 10px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .items-table thead th:nth-child(2) { text-align: center; }
    .items-table thead th:nth-child(3), .items-table thead th:nth-child(4) { text-align: center; }
    .items-table thead th:nth-child(1) { width: 50%; }
    .items-table thead th:nth-child(2) { width: 12%; }
    .items-table thead th:nth-child(3), .items-table thead th:nth-child(4) { width: 19%; }
    .items-table tbody td { padding: 8px 10px; vertical-align: middle; border-bottom: 1px solid #e5e5e5; }
    .items-table tbody tr:nth-child(even) { background: #f8f9fa; }
    .items-table tbody tr:last-child td { border-bottom: 2px solid #1e3a5f; }
    .item-name { font-weight: 500; color: #1a1a1a; }
    .item-extras { font-size: 11px; color: #555; margin-top: 3px; line-height: 1.5; }
    .price-cell { text-align: center; font-weight: 600; color: #1a1a1a; white-space: nowrap; }
    .summary { width: 180px; border: 1px solid #e5e5e5; font-size: 10px; }
    .summary-row { display: flex; justify-content: space-between; padding: 5px 8px; align-items: center; gap: 6px; }
    .summary-row.subtotal, .summary-row.vat { background: #fefde7; font-weight: 600; color: #1a1a1a; font-size: 10px; }
    .summary-row.total {
      background: #facc15; font-weight: 700; color: #1a1a1a; font-size: 11px; border-top: 1px solid #e5e5e5; padding: 6px 8px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .summary-row .amount { font-weight: 600; }
    .summary-row.total .amount { font-size: 12px; font-weight: 700; }
    .notes-section { margin-top: 12px; padding-top: 10px; border-top: 1px solid #e0e0e0; text-align: right; }
    .notes-title { font-size: 11px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
    .notes-list { list-style: disc; padding-right: 18px; margin: 0 0 4px; font-size: 11px; color: #555; line-height: 1.5; }
    .notes-list li { margin-bottom: 2px; }
    .notes-content { font-size: 11px; color: #555; margin-bottom: 4px; }
    .notes-validity { font-size: 10px; color: #777; margin-top: 4px; }
    .pdf-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; }
    .footer-sig-block { flex: 1; max-width: 220px; text-align: center; }
    .footer-sig-block.footer-sig-client { text-align: right; }
    .footer-sig-block.footer-sig-business { text-align: left; }
    .footer-sig-label { display: block; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; font-size: 11px; }
    .footer-sig-line { display: block; height: 2px; background: #333; width: 100%; min-width: 120px; margin-top: 2px; }
    @media print {
      body, .quote-pdf-body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .header-band, .items-table thead th, .summary-row.total { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;
}

export const generateQuotePDF = (
  items: BasketItem[],
  totalBeforeVAT: number,
  VAT: number,
  totalWithVAT: number,
  profile?: QuoteProfile | null,
  customerName?: string | null,
  notes?: string | null,
  quoteTitle?: string | null,
  quoteNumber?: number | null,
  customerPhone?: string | null,
  customerEmail?: string | null,
  customerAddress?: string | null,
  customerCompanyId?: string | null,
  validityDays?: number | null
) => {
  const content = buildQuoteContent({
    items,
    totalBeforeVAT,
    totalWithVAT,
    profile,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    customerCompanyId,
    notes,
    quoteTitle,
    quoteNumber,
    validityDays,
  });
  const { profileBlock, notesBlock, footerBlock, validityText, today, items: contentItems } = content;
  const tableRows = contentItems.map((item) => {
    const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
    const calculatedPrice = item.basePrice + extrasTotal;
    const currentPrice = item.overridePrice ?? calculatedPrice;
    const qty = item.quantity ?? 1;
    const pricePerUnit = currentPrice / qty;
    const hasExtras = item.extras && item.extras.length > 0;
    const extrasDesc = hasExtras
      ? item.extras!.map((e) => `• ${escapeHtml(formatExtraForQuote(e.text))}`).join('<br>')
      : '';
    const qtyDisplay = qty > 1 && item.unit ? `${qty} ${item.unit}` : String(qty);
    return `
      <tr>
        <td><div class="item-name">${escapeHtml(item.name)}</div>${extrasDesc ? `<div class="item-extras">${extrasDesc}</div>` : ''}</td>
        <td style="text-align:center">${escapeHtml(qtyDisplay)}</td>
        <td class="price-cell">₪${pricePerUnit.toLocaleString('he-IL')}</td>
        <td class="price-cell">₪${currentPrice.toLocaleString('he-IL')}</td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>הצעת מחיר ${today}</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Heebo', 'Assistant', 'Segoe UI', Tahoma, sans-serif; direction: rtl; color: #1a1a1a; background: #fff; padding: 0 20px 20px; font-size: 12px; line-height: 1.4; }
    .container { max-width: 560px; margin: 0 auto; }
    .header-band { height: 4px; background: #1e3a5f; margin: 0 -20px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 10px 0 8px; border-bottom: 1px solid #e0e0e0; margin-bottom: 10px; }
    .header-company-wrap { text-align: right; flex: 1; }
    .header-company { font-size: 11px; color: #333; line-height: 1.5; }
    .header-company .company-name { font-weight: 600; font-size: 13px; color: #1a1a1a; margin-bottom: 2px; }
    .header-company .company-line { margin-top: 1px; color: #555; }
    .header-logo-wrap { flex-shrink: 0; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; }
    .header-logo { width: 56px; height: 56px; object-fit: contain; display: block; }
    .header-logo-placeholder { width: 56px; height: 56px; background: #f5f5f5; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #1e3a5f; font-weight: 600; }
    .title-row { margin-bottom: 10px; }
    .quote-title { font-size: 18px; font-weight: 700; color: #1a1a1a; text-align: center; margin-bottom: 6px; letter-spacing: -0.02em; }
    .title-meta { display: flex; justify-content: space-between; font-size: 10px; color: #555; }
    .for-block { margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 11px; color: #333; text-align: right; }
    .for-label { font-weight: 600; color: #1a1a1a; }
    .for-details { font-size: 10px; color: #555; margin-top: 4px; display: block; line-height: 1.5; }
    .table-summary-wrap { display: block; margin-bottom: 12px; }
    .table-summary-wrap .items-table { margin-bottom: 8px; }
    .table-summary-wrap .summary-below { display: flex; justify-content: flex-end; direction: rtl; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; table-layout: fixed; font-size: 11px; }
    .items-table thead th { background: #1e3a5f; color: #fff; padding: 8px 10px; text-align: right; font-weight: 600; font-size: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .items-table thead th:nth-child(2) { text-align: center; }
    .items-table thead th:nth-child(3), .items-table thead th:nth-child(4) { text-align: center; }
    .items-table thead th:nth-child(1) { width: 50%; }
    .items-table thead th:nth-child(2) { width: 12%; }
    .items-table thead th:nth-child(3), .items-table thead th:nth-child(4) { width: 19%; }
    .items-table tbody td { padding: 8px 10px; vertical-align: middle; border-bottom: 1px solid #e5e5e5; }
    .items-table tbody tr:nth-child(even) { background: #f8f9fa; }
    .items-table tbody tr:last-child td { border-bottom: 2px solid #1e3a5f; }
    .item-name { font-weight: 500; color: #1a1a1a; }
    .item-extras { font-size: 10px; color: #555; margin-top: 2px; line-height: 1.5; }
    .price-cell { text-align: center; font-weight: 600; color: #1a1a1a; white-space: nowrap; }
    .summary { width: 180px; border: 1px solid #e5e5e5; font-size: 10px; }
    .summary-row { display: flex; justify-content: space-between; padding: 5px 8px; align-items: center; gap: 6px; }
    .summary-row.subtotal, .summary-row.vat { background: #fefde7; font-weight: 600; color: #1a1a1a; font-size: 10px; }
    .summary-row.total { background: #facc15; font-weight: 700; color: #1a1a1a; font-size: 11px; border-top: 1px solid #e5e5e5; padding: 6px 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .summary-row .amount { font-weight: 600; }
    .summary-row.total .amount { font-size: 12px; font-weight: 700; }
    .notes-section { margin-top: 12px; padding-top: 10px; border-top: 1px solid #e0e0e0; text-align: right; }
    .notes-title { font-size: 11px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
    .notes-list { list-style: disc; padding-right: 18px; margin: 0 0 4px; font-size: 11px; color: #555; line-height: 1.5; }
    .notes-list li { margin-bottom: 2px; }
    .notes-content { font-size: 11px; color: #555; margin-bottom: 4px; }
    .notes-validity { font-size: 10px; color: #777; margin-top: 4px; }
    .pdf-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; }
    .footer-sig-block { flex: 1; max-width: 220px; text-align: center; }
    .footer-sig-block.footer-sig-client { text-align: right; }
    .footer-sig-block.footer-sig-business { text-align: left; }
    .footer-sig-label { display: block; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; font-size: 11px; }
    .footer-sig-line { display: block; height: 2px; background: #333; width: 100%; min-width: 120px; margin-top: 2px; }
    @media print { body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .container { max-width: 100%; } .header-band, .items-table thead th, .summary-row.total { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="content-block">
    ${profileBlock}
    <div class="table-summary-wrap">
      <table class="items-table">
        <thead>
          <tr>
            <th>תיאור השירות / המוצר</th>
            <th>יחידות</th>
            <th>מחיר</th>
            <th>סה"כ</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="summary-below">
        <div class="summary">
          <div class="summary-row subtotal"><span>סה"כ</span><span class="amount">₪${totalBeforeVAT.toLocaleString('he-IL')}</span></div>
          <div class="summary-row vat"><span>מע"מ (18%)</span><span class="amount">₪${VAT.toLocaleString('he-IL')}</span></div>
          <div class="summary-row total"><span>סה"כ לתשלום</span><span class="amount">₪${totalWithVAT.toLocaleString('he-IL')}</span></div>
        </div>
      </div>
    </div>
    ${notesBlock}
    </div>
    ${footerBlock}
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
</body>
</html>
  `;
  
  // פתיחת חלון חדש עם ה-HTML
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  
  if (!printWindow) {
    alert('אנא אפשר חלונות קופצים כדי להוריד את ה-PDF');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
};

const ROWS_PER_PAGE = 20; // שורות טבלה לכל עמוד (משאיר מקום לסיכום וחתימות בדף האחרון)

function rowToHtml(item: BasketItem): string {
  const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
  const calculatedPrice = item.basePrice + extrasTotal;
  const currentPrice = item.overridePrice ?? calculatedPrice;
  const qty = item.quantity ?? 1;
  const pricePerUnit = currentPrice / qty;
  const hasExtras = item.extras && item.extras.length > 0;
  const extrasDesc = hasExtras
    ? item.extras!.map((e) => `• ${escapeHtml(formatExtraForQuote(e.text))}`).join('<br>')
    : '';
  const qtyDisplay = qty > 1 && item.unit ? `${qty} ${item.unit}` : String(qty);
  return `
    <tr>
      <td><div class="item-name">${escapeHtml(item.name)}</div>${extrasDesc ? `<div class="item-extras">${extrasDesc}</div>` : ''}</td>
      <td style="text-align:center">${escapeHtml(qtyDisplay)}</td>
      <td class="price-cell">₪${pricePerUnit.toLocaleString('he-IL')}</td>
      <td class="price-cell">₪${currentPrice.toLocaleString('he-IL')}</td>
    </tr>
  `;
}

/** מייצר את הצעת המחיר כ-PDF ומחזיר Blob – תומך במספר דפים בלתי מוגבל, שורת חתימות בדף האחרון */
export async function generateQuotePDFAsBlob(
  items: BasketItem[],
  totalBeforeVAT: number,
  VAT: number,
  totalWithVAT: number,
  profile?: QuoteProfile | null,
  customerName?: string | null,
  notes?: string | null,
  quoteTitle?: string | null,
  quoteNumber?: number | null,
  customerPhone?: string | null,
  customerEmail?: string | null,
  customerAddress?: string | null,
  customerCompanyId?: string | null,
  validityDays?: number | null,
  vatRate?: number
): Promise<Blob> {
  const rate = vatRate ?? 0.18;
  const vatLabel = rate === 0 ? 'עוסק פטור' : `מע"מ (${Math.round(rate * 100)}%)`;
  const content = buildQuoteContent({
    items,
    totalBeforeVAT,
    totalWithVAT,
    profile,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    customerCompanyId,
    notes,
    quoteTitle,
    quoteNumber,
    validityDays,
    vatRate: rate,
  });
  const { profileBlock, notesBlock, footerBlock, items: contentItems } = content;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;

  const tableHeader = `
    <thead>
      <tr>
        <th>תיאור השירות / המוצר</th>
        <th>יחידות</th>
        <th>מחיר</th>
        <th>סה"כ</th>
      </tr>
    </thead>
  `;

  const summaryBlock = `
    <div class="summary-below">
      <div class="summary">
        <div class="summary-row subtotal"><span>סה"כ</span><span class="amount">₪${totalBeforeVAT.toLocaleString('he-IL')}</span></div>
        <div class="summary-row vat"><span>${vatLabel}</span><span class="amount">₪${VAT.toLocaleString('he-IL')}</span></div>
        <div class="summary-row total"><span>סה"כ לתשלום</span><span class="amount">₪${totalWithVAT.toLocaleString('he-IL')}</span></div>
      </div>
    </div>
  `;

  const chunks: BasketItem[][] = [];
  for (let i = 0; i < contentItems.length; i += ROWS_PER_PAGE) {
    chunks.push(contentItems.slice(i, i + ROWS_PER_PAGE));
  }

  if (typeof document !== 'undefined' && document.fonts?.ready) await document.fonts.ready;

  const styles = getQuoteStyles("'Heebo', 'Assistant', 'Segoe UI', Tahoma, sans-serif");

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isFirst = i === 0;
    const isLast = i === chunks.length - 1;
    const tableRows = chunk.map(rowToHtml).join('');

    let pageContent = '';
    if (isFirst) pageContent += profileBlock;

    pageContent += `
      <div class="table-summary-wrap">
        <table class="items-table">
          ${tableHeader}
          <tbody>${tableRows}</tbody>
        </table>
        ${isLast ? summaryBlock : ''}
      </div>
    `;
    if (isLast) {
      pageContent += notesBlock;
      pageContent += footerBlock;
    }

    const fragment = `
      <style>${styles}</style>
      <div class="quote-pdf-body" dir="rtl">
        <div class="container">
          ${pageContent}
        </div>
      </div>
    `;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;background:#fff;z-index:-1;overflow:visible;';
    wrap.innerHTML = fragment;
    document.body.appendChild(wrap);

    await new Promise((r) => setTimeout(r, 200));

    const canvas = await html2canvas(wrap, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    document.body.removeChild(wrap);

    const imgW = pageW;
    const imgH = (pageW * canvas.height) / canvas.width;

    if (i > 0) doc.addPage();

    if (imgH <= pageH) {
      doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgW, imgH);
    } else {
      const sliceHeightPx = (pageH / pageW) * canvas.width;
      let drawn = 0;
      let firstSlice = true;
      while (drawn < canvas.height) {
        if (!firstSlice) doc.addPage();
        firstSlice = false;
        const sliceH = Math.min(sliceHeightPx, canvas.height - drawn);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, drawn, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const sliceImgH = (pageW * sliceH) / canvas.width;
        doc.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgW, sliceImgH);
        drawn += sliceH;
      }
    }
  }

  return doc.output('blob');
}
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface BasketItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  overridePrice?: number;
  extras?: Array<{ text: string; price: number }>;
}

/** פרופיל בעל המקצוע – מופיע בראש הצעת המחיר */
export interface QuoteProfile {
  businessName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string; // base64 data URL
}

const formatPrice = (n: number) => '₪' + n.toLocaleString('he-IL');

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const hasProfile = (p?: QuoteProfile | null) =>
  p && (p.businessName || p.phone || p.logo || p.contactName || p.email || p.address);

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
  notes?: string | null;
  quoteTitle?: string | null;
  quoteNumber?: number | null;
  validityDays?: number | null;
}) {
  const { items, totalBeforeVAT, totalWithVAT, profile, customerName, customerPhone, customerEmail, customerAddress, notes, quoteTitle, quoteNumber, validityDays } = params;
  const today = new Date().toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const titleText = [quoteTitle?.trim() || 'הצעת מחיר', quoteNumber != null ? `#${quoteNumber}` : ''].filter(Boolean).join(' ');
  const hasCustomer = customerName?.trim() || customerPhone?.trim() || customerEmail?.trim() || customerAddress?.trim();
  const customerNameVal = customerName?.trim() ?? '—';
  const customerLines: string[] = [];
  if (customerPhone?.trim()) customerLines.push(`<span class="client-phone">${escapeHtml(customerPhone.trim())}</span>`);
  if (customerAddress?.trim()) customerLines.push(`<span class="client-address">${escapeHtml(customerAddress.trim())}</span>`);
  if (customerEmail?.trim() && !customerPhone?.trim() && !customerAddress?.trim()) customerLines.push(escapeHtml(customerEmail.trim()));
  const clientDetails = customerLines.length > 0 ? customerLines.join(' &nbsp; ') : '—';
  const forBlock = `<div class="for-block"><span class="for-label">עבור:</span> <strong>${escapeHtml(customerNameVal)}</strong><br><span class="for-details">${clientDetails}</span></div>`;

  const days = validityDays != null && validityDays >= 1 ? validityDays : 30;
  const validityText = `הצעת מחיר זו תקפה ל-${days} יום מיום הנפקתה`;
  const quoteNumText = quoteNumber != null ? `מס' הצעה: #${quoteNumber}` : '';
  const titleOnly = quoteTitle?.trim() || 'הצעת מחיר לשיפוץ כללי';

  const companyLines: string[] = [];
  if (profile?.businessName) companyLines.push(`<div class="company-name">${escapeHtml(profile.businessName)}</div>`);
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

  const VAT = totalBeforeVAT * 0.18;
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

/** עיצוב מקצועי להצעת מחיר – RTL, Heebo/Assistant, Navy header, טבלה, סיכום צהוב בולט, הערות כרשימה, קווי חתימה. */
function getQuoteStyles(fontFamily = "'Heebo', 'Assistant', 'Segoe UI', Tahoma, sans-serif") {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .quote-pdf-body {
      font-family: ${fontFamily};
      direction: rtl;
      color: #1a1a1a;
      background: #fff;
      padding: 0 28px 28px;
      font-size: 12px;
      line-height: 1.5;
      width: 560px;
    }
    .container { max-width: 560px; margin: 0 auto; }
    .header-band { height: 6px; background: #1e3a5f; margin: 0 -28px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header-top {
      display: flex; justify-content: space-between; align-items: stretch; gap: 24px;
      padding: 20px 0 18px; border-bottom: 1px solid #e0e0e0; margin-bottom: 18px; min-height: 140px;
    }
    .header-company-wrap { text-align: right; flex: 1; }
    .header-company { font-size: 12px; color: #333; line-height: 1.7; }
    .header-company .company-name { font-weight: 600; font-size: 14px; color: #1a1a1a; margin-bottom: 4px; }
    .header-company .company-line { margin-top: 2px; color: #555; }
    .header-logo-wrap { flex: 1; min-width: 160px; display: flex; align-items: center; justify-content: center; }
    .header-logo { width: 100%; height: 100%; min-height: 100px; object-fit: contain; display: block; }
    .header-logo-placeholder {
      width: 100%; min-height: 80px; height: 100%; background: #f5f5f5; border: 1px solid #ddd;
      display: flex; align-items: center; justify-content: center; font-size: 11px; color: #1e3a5f; font-weight: 600;
    }
    .title-row { margin-bottom: 20px; }
    .quote-title { font-size: 20px; font-weight: 700; color: #1a1a1a; text-align: center; margin-bottom: 10px; letter-spacing: -0.02em; }
    .title-meta { display: flex; justify-content: space-between; font-size: 11px; color: #555; }
    .for-block { margin-bottom: 20px; padding: 14px 0; border-bottom: 1px solid #eee; font-size: 12px; color: #333; text-align: right; }
    .for-label { font-weight: 600; color: #1a1a1a; }
    .for-details { font-size: 11px; color: #555; margin-top: 6px; display: block; line-height: 1.6; }
    .table-summary-wrap { display: flex; flex-direction: row; align-items: flex-start; gap: 20px; margin-bottom: 20px; direction: rtl; }
    .table-summary-wrap .items-table { margin-bottom: 0; flex: 1; min-width: 0; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; font-size: 12px; }
    .items-table thead th {
      background: #1e3a5f; color: #fff; padding: 11px 12px; text-align: right; font-weight: 600; font-size: 11px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .items-table thead th:nth-child(2) { text-align: center; }
    .items-table thead th:nth-child(3), .items-table thead th:nth-child(4) { text-align: center; }
    .items-table thead th:nth-child(1) { width: 50%; }
    .items-table thead th:nth-child(2) { width: 12%; }
    .items-table thead th:nth-child(3), .items-table thead th:nth-child(4) { width: 19%; }
    .items-table tbody td { padding: 11px 12px; vertical-align: middle; border-bottom: 1px solid #e5e5e5; }
    .items-table tbody tr:nth-child(even) { background: #f8f9fa; }
    .items-table tbody tr:last-child td { border-bottom: 2px solid #1e3a5f; }
    .item-name { font-weight: 500; color: #1a1a1a; }
    .item-extras { font-size: 11px; color: #555; margin-top: 3px; }
    .price-cell { text-align: center; font-weight: 600; color: #1a1a1a; white-space: nowrap; }
    .summary { width: 220px; flex-shrink: 0; border: 1px solid #e5e5e5; font-size: 12px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 12px; align-items: center; gap: 12px; }
    .summary-row.subtotal, .summary-row.vat { background: #fefde7; font-weight: 600; color: #1a1a1a; font-size: 12px; }
    .summary-row.total {
      background: #facc15; font-weight: 700; color: #1a1a1a; font-size: 13px; border-top: 1px solid #e5e5e5; padding: 10px 12px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .summary-row .amount { font-weight: 600; }
    .summary-row.total .amount { font-size: 14px; font-weight: 700; }
    .notes-section { margin-top: 24px; padding-top: 18px; border-top: 1px solid #e0e0e0; text-align: right; }
    .notes-title { font-size: 12px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
    .notes-list { list-style: disc; padding-right: 20px; margin: 0 0 8px; font-size: 12px; color: #555; line-height: 1.65; }
    .notes-list li { margin-bottom: 4px; }
    .notes-content { font-size: 12px; color: #555; margin-bottom: 8px; }
    .notes-validity { font-size: 11px; color: #777; margin-top: 6px; }
    .pdf-footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
    .footer-sig-block { flex: 1; max-width: 240px; text-align: center; }
    .footer-sig-block.footer-sig-client { text-align: right; }
    .footer-sig-block.footer-sig-business { text-align: left; }
    .footer-sig-label { display: block; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; font-size: 12px; }
    .footer-sig-line { display: block; height: 2px; background: #333; width: 100%; min-width: 140px; margin-top: 4px; }
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
    const hasExtras = item.extras && item.extras.length > 0;
    const extrasDesc = !(item.overridePrice !== undefined) && hasExtras
      ? item.extras!.map((e) => `+ ${e.text}`).join(', ')
      : '';
    return `
      <tr>
        <td><div class="item-name">${item.name}</div>${extrasDesc ? `<div class="item-extras">${extrasDesc}</div>` : ''}</td>
        <td style="text-align:center">1</td>
        <td class="price-cell">₪${currentPrice.toLocaleString('he-IL')}</td>
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
    body { font-family: 'Heebo', 'Assistant', 'Segoe UI', Tahoma, sans-serif; direction: rtl; color: #1a1a1a; background: #fff; padding: 0 28px 28px; font-size: 12px; line-height: 1.5; }
    .container { max-width: 560px; margin: 0 auto; }
    .header-band { height: 6px; background: #1e3a5f; margin: 0 -28px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header-top { display: flex; justify-content: space-between; align-items: stretch; gap: 24px; padding: 20px 0 18px; border-bottom: 1px solid #e0e0e0; margin-bottom: 18px; min-height: 140px; }
    .header-company-wrap { text-align: right; flex: 1; }
    .header-company { font-size: 12px; color: #333; line-height: 1.7; }
    .header-company .company-name { font-weight: 600; font-size: 14px; color: #1a1a1a; margin-bottom: 4px; }
    .header-company .company-line { margin-top: 2px; color: #555; }
    .header-logo-wrap { flex: 1; min-width: 160px; display: flex; align-items: center; justify-content: center; }
    .header-logo { width: 100%; height: 100%; min-height: 100px; object-fit: contain; display: block; }
    .header-logo-placeholder { width: 100%; min-height: 100px; height: 100%; background: #f5f5f5; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #1e3a5f; font-weight: 600; }
    .title-row { margin-bottom: 20px; }
    .quote-title { font-size: 20px; font-weight: 700; color: #1a1a1a; text-align: center; margin-bottom: 10px; letter-spacing: -0.02em; }
    .title-meta { display: flex; justify-content: space-between; font-size: 11px; color: #555; }
    .for-block { margin-bottom: 20px; padding: 14px 0; border-bottom: 1px solid #eee; font-size: 12px; color: #333; text-align: right; }
    .for-label { font-weight: 600; color: #1a1a1a; }
    .for-details { font-size: 11px; color: #555; margin-top: 6px; display: block; line-height: 1.6; }
    .table-summary-wrap { display: flex; flex-direction: row; align-items: flex-start; gap: 20px; margin-bottom: 20px; direction: rtl; }
    .table-summary-wrap .items-table { margin-bottom: 0; flex: 1; min-width: 0; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; font-size: 12px; }
    .items-table thead th { background: #1e3a5f; color: #fff; padding: 11px 12px; text-align: right; font-weight: 600; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .items-table thead th:nth-child(2), .items-table thead th:nth-child(3), .items-table thead th:nth-child(4) { text-align: center; }
    .items-table thead th:nth-child(1) { width: 50%; }
    .items-table thead th:nth-child(2) { width: 12%; }
    .items-table thead th:nth-child(3), .items-table thead th:nth-child(4) { width: 19%; }
    .items-table tbody td { padding: 11px 12px; vertical-align: middle; border-bottom: 1px solid #e5e5e5; }
    .items-table tbody tr:nth-child(even) { background: #f8f9fa; }
    .items-table tbody tr:last-child td { border-bottom: 2px solid #1e3a5f; }
    .item-name { font-weight: 500; color: #1a1a1a; }
    .item-extras { font-size: 11px; color: #555; margin-top: 3px; }
    .price-cell { text-align: center; font-weight: 600; color: #1a1a1a; white-space: nowrap; }
    .summary { width: 220px; flex-shrink: 0; border: 1px solid #e5e5e5; font-size: 12px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 12px; align-items: center; gap: 12px; }
    .summary-row.subtotal, .summary-row.vat { background: #fefde7; font-weight: 600; color: #1a1a1a; font-size: 12px; }
    .summary-row.total { background: #facc15; font-weight: 700; color: #1a1a1a; font-size: 13px; border-top: 1px solid #e5e5e5; padding: 10px 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .summary-row .amount { font-weight: 600; }
    .summary-row.total .amount { font-size: 14px; font-weight: 700; }
    .notes-section { margin-top: 24px; padding-top: 18px; border-top: 1px solid #e0e0e0; text-align: right; }
    .notes-title { font-size: 12px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
    .notes-list { list-style: disc; padding-right: 20px; margin: 0 0 8px; font-size: 12px; color: #555; line-height: 1.65; }
    .notes-list li { margin-bottom: 4px; }
    .notes-content { font-size: 12px; color: #555; margin-bottom: 8px; }
    .notes-validity { font-size: 11px; color: #777; margin-top: 6px; }
    .pdf-footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
    .footer-sig-block { flex: 1; max-width: 240px; text-align: center; }
    .footer-sig-block.footer-sig-client { text-align: right; }
    .footer-sig-block.footer-sig-business { text-align: left; }
    .footer-sig-label { display: block; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; font-size: 12px; }
    .footer-sig-line { display: block; height: 2px; background: #333; width: 100%; min-width: 140px; margin-top: 4px; }
    @media print { body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .container { max-width: 100%; } .header-band, .items-table thead th, .summary-row.total { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
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
      <div class="summary">
        <div class="summary-row subtotal"><span>סה"כ</span><span class="amount">₪${totalBeforeVAT.toLocaleString('he-IL')}</span></div>
        <div class="summary-row vat"><span>מע"מ (18%)</span><span class="amount">₪${VAT.toLocaleString('he-IL')}</span></div>
        <div class="summary-row total"><span>סה"כ לתשלום</span><span class="amount">₪${totalWithVAT.toLocaleString('he-IL')}</span></div>
      </div>
    </div>
    ${notesBlock}
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

/** מייצר את הצעת המחיר כ-PDF ומחזיר Blob – באמצעות HTML + html2canvas כדי שהעברית תוצג נכון (גופן Heebo) */
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
  validityDays?: number | null
): Promise<Blob> {
  const content = buildQuoteContent({
    items,
    totalBeforeVAT,
    totalWithVAT,
    profile,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    notes,
    quoteTitle,
    quoteNumber,
    validityDays,
  });
  const { profileBlock, notesBlock, footerBlock, validityText, items: contentItems } = content;

  const tableRows = contentItems
    .map((item) => {
      const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
      const calculatedPrice = item.basePrice + extrasTotal;
      const currentPrice = item.overridePrice ?? calculatedPrice;
      const hasExtras = item.extras && item.extras.length > 0;
      const extrasDesc =
        item.overridePrice === undefined && hasExtras
          ? item.extras!.map((e) => `+ ${escapeHtml(e.text)}`).join(', ')
          : '';
      return `
        <tr>
          <td><div class="item-name">${escapeHtml(item.name)}</div>${extrasDesc ? `<div class="item-extras">${extrasDesc}</div>` : ''}</td>
          <td style="text-align:center">1</td>
          <td class="price-cell">₪${currentPrice.toLocaleString('he-IL')}</td>
          <td class="price-cell">₪${currentPrice.toLocaleString('he-IL')}</td>
        </tr>
      `;
    })
    .join('');

  const fragment = `
    <style>${getQuoteStyles("'Heebo', 'Assistant', 'Segoe UI', Tahoma, sans-serif")}</style>
    <div class="quote-pdf-body" dir="rtl">
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
          <div class="summary">
            <div class="summary-row subtotal"><span>סה"כ</span><span class="amount">₪${totalBeforeVAT.toLocaleString('he-IL')}</span></div>
            <div class="summary-row vat"><span>מע"מ (18%)</span><span class="amount">₪${VAT.toLocaleString('he-IL')}</span></div>
            <div class="summary-row total"><span>סה"כ לתשלום</span><span class="amount">₪${totalWithVAT.toLocaleString('he-IL')}</span></div>
          </div>
        </div>
        ${notesBlock}
        ${footerBlock}
      </div>
    </div>
  `;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;background:#fff;z-index:-1;';
  wrap.innerHTML = fragment;
  document.body.appendChild(wrap);

  if (typeof document !== 'undefined' && document.fonts?.ready) await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 350));

  const canvas = await html2canvas(wrap, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });
  document.body.removeChild(wrap);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const imgW = pageW;
  const imgH = (pageW * canvas.height) / canvas.width;

  if (imgH <= pageH) {
    doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgW, imgH);
  } else {
    const sliceHeightPx = (pageH / pageW) * canvas.width;
    let drawn = 0;
    while (drawn < canvas.height) {
      if (drawn > 0) doc.addPage();
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

  return doc.output('blob');
}
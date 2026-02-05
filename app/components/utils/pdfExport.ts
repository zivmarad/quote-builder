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
  const titleOnly = quoteTitle?.trim() || 'הצעת מחיר';

  const companyLines: string[] = [];
  if (profile?.businessName) companyLines.push(`<div class="company-name">${escapeHtml(profile.businessName)}</div>`);
  if (profile?.phone) companyLines.push(`<div class="company-line">${escapeHtml(profile.phone)}</div>`);
  if (profile?.address) companyLines.push(`<div class="company-line">${escapeHtml(profile.address)}</div>`);
  if (profile?.email) companyLines.push(`<div class="company-line">${escapeHtml(profile.email)}</div>`);
  const companyBlock =
    companyLines.length > 0
      ? `<div class="company-block">${companyLines.join('')}</div>`
      : '';

  const headerTop =
    hasProfile(profile)
      ? `<div class="header-top"><div class="header-top-inner">${profile!.logo ? `<img src="${profile!.logo}" alt="לוגו" class="header-logo" />` : '<div class="header-logo-placeholder">הלוגו שלך</div>'}${companyBlock}</div></div>`
      : '<div class="header-top"></div>';
  const titleRow = `<div class="title-row"><h1 class="quote-title">${escapeHtml(titleOnly)}</h1><div class="title-meta"><span class="quote-num">${quoteNumText}</span><span class="quote-date">תאריך: ${today}</span></div></div>`;

  const profileBlock = `${headerTop}${titleRow}${forBlock}`;

  const notesText = notes?.trim() ?? '';
  const notesBlock = `<div class="notes-section"><div class="notes-title">הערות:</div>${notesText ? `<div class="notes-content">${escapeHtml(notesText).replace(/\n/g, '<br>')}</div>` : '<div class="notes-content">—</div>'}${validityText ? `<p class="notes-validity">${escapeHtml(validityText)}</p>` : ''}</div>`;

  const footerBlock = `<div class="pdf-footer"><span class="footer-company">${hasProfile(profile) ? escapeHtml(profile!.businessName || '') : ''}</span><span class="footer-signature"><span class="footer-client-name">${escapeHtml(customerNameVal)}</span><span class="footer-line">_________________________</span></span></div>`;

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

/** מחזיר את מחרוזת ה-CSS להצעת המחיר – לפי עיצוב "הצעת מחיר לשיפוץ" (לוגו מימין, כותרת במרכז, עבור, פוטר). */
function getQuoteStyles(fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif") {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .quote-pdf-body {
      font-family: ${fontFamily};
      direction: rtl;
      color: #171717;
      background: #fff;
      padding: 20px 24px;
      font-size: 12px;
      line-height: 1.5;
      width: 560px;
    }
    .container { max-width: 560px; margin: 0 auto; }
    .header-top { position: relative; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e5e5; text-align: right; }
    .header-top-inner { display: inline-block; text-align: right; }
    .header-logo { width: 52px; height: 52px; object-fit: contain; display: block; margin-bottom: 10px; }
    .header-logo-placeholder {
      width: 52px; height: 52px; background: #f0f0f0; border: 1px dashed #ccc;
      display: flex; align-items: center; justify-content: center; font-size: 10px; color: #737373; margin-bottom: 10px;
    }
    .company-block { font-size: 12px; color: #333; line-height: 1.65; }
    .company-name { font-weight: 600; font-size: 14px; color: #171717; margin-bottom: 2px; }
    .company-line { margin-top: 1px; }
    .title-row { margin-bottom: 18px; }
    .quote-title { font-size: 22px; font-weight: 700; color: #171717; text-align: center; margin-bottom: 8px; letter-spacing: -0.02em; }
    .title-meta { display: flex; justify-content: space-between; font-size: 12px; color: #525252; }
    .quote-num { }
    .quote-date { }
    .for-block { margin-bottom: 22px; padding: 12px 0; font-size: 13px; color: #333; border-bottom: 1px solid #eee; }
    .for-label { font-weight: 600; color: #171717; }
    .for-details { font-size: 12px; color: #525252; margin-top: 4px; display: block; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; table-layout: fixed; }
    .items-table thead th {
      background: #1a1a2e; color: #fff; padding: 12px 14px; text-align: right; font-weight: 600; font-size: 11px;
    }
    .items-table thead th:nth-child(1) { width: 50%; }
    .items-table thead th:nth-child(2) { width: 14%; text-align: center; }
    .items-table thead th:nth-child(3), .items-table thead th:nth-child(4) { width: 18%; text-align: left; }
    .items-table tbody td { padding: 12px 14px; border-bottom: 1px solid #e5e5e5; vertical-align: middle; font-size: 12px; }
    .items-table tbody tr:last-child td { border-bottom: 2px solid #1a1a2e; }
    .item-name { font-weight: 600; color: #171717; }
    .item-extras { font-size: 11px; color: #525252; margin-top: 4px; }
    .price-cell { text-align: left; font-weight: 600; color: #171717; white-space: nowrap; }
    .summary { max-width: 260px; margin: 0 0 0 auto; border: 1px solid #e5e5e5; overflow: hidden; }
    .summary-row { display: flex; justify-content: space-between; padding: 10px 14px; font-size: 13px; gap: 16px; align-items: center; }
    .summary-row.subtotal, .summary-row.vat { background: #fef9c3; font-weight: 600; color: #171717; }
    .summary-row.total { background: #fef9c3; font-size: 15px; font-weight: 700; color: #171717; border-top: 2px solid #e5e5e5; }
    .summary-row .amount { font-weight: 700; }
    .notes-section { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e5e5; text-align: right; }
    .notes-title { font-size: 13px; font-weight: 700; color: #171717; margin-bottom: 8px; }
    .notes-content { font-size: 12px; color: #525252; line-height: 1.6; white-space: pre-line; margin-bottom: 10px; }
    .notes-validity { font-size: 11px; color: #737373; margin: 8px 0; }
    .pdf-footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; }
    .footer-company { font-weight: 600; color: #171717; }
    .footer-signature { text-align: left; }
    .footer-client-name { display: block; font-weight: 600; color: #171717; margin-bottom: 4px; }
    .footer-line { display: block; font-size: 11px; color: #737373; letter-spacing: 2px; }
    .footer { margin-top: 12px; }
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
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; color: #171717; background: #fff; padding: 20px 24px; font-size: 12px; line-height: 1.5; }
    .container { max-width: 560px; margin: 0 auto; }
    .header-top { position: relative; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e5e5; text-align: right; }
    .header-top-inner { display: inline-block; text-align: right; }
    .header-logo { width: 52px; height: 52px; object-fit: contain; display: block; margin-bottom: 10px; }
    .header-logo-placeholder { width: 52px; height: 52px; background: #f0f0f0; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #737373; margin-bottom: 10px; }
    .company-block { font-size: 12px; color: #333; line-height: 1.65; }
    .company-name { font-weight: 600; font-size: 14px; color: #171717; margin-bottom: 2px; }
    .company-line { margin-top: 1px; }
    .title-row { margin-bottom: 18px; }
    .quote-title { font-size: 22px; font-weight: 700; color: #171717; text-align: center; margin-bottom: 8px; letter-spacing: -0.02em; }
    .title-meta { display: flex; justify-content: space-between; font-size: 12px; color: #525252; }
    .for-block { margin-bottom: 22px; padding: 12px 0; font-size: 13px; color: #333; border-bottom: 1px solid #eee; }
    .for-label { font-weight: 600; color: #171717; }
    .for-details { font-size: 12px; color: #525252; margin-top: 4px; display: block; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; table-layout: fixed; }
    .items-table thead th { background: #1a1a2e; color: #fff; padding: 12px 14px; text-align: right; font-weight: 600; font-size: 11px; }
    .items-table thead th:nth-child(1) { width: 50%; }
    .items-table thead th:nth-child(2) { width: 14%; text-align: center; }
    .items-table thead th:nth-child(3), .items-table thead th:nth-child(4) { width: 18%; text-align: left; }
    .items-table tbody td { padding: 12px 14px; border-bottom: 1px solid #e5e5e5; vertical-align: middle; font-size: 12px; }
    .items-table tbody tr:last-child td { border-bottom: 2px solid #1a1a2e; }
    .item-name { font-weight: 600; color: #171717; }
    .item-extras { font-size: 11px; color: #525252; margin-top: 4px; }
    .price-cell { text-align: left; font-weight: 600; color: #171717; white-space: nowrap; }
    .summary { max-width: 260px; margin: 0 0 0 auto; border: 1px solid #e5e5e5; }
    .summary-row { display: flex; justify-content: space-between; padding: 10px 14px; font-size: 13px; gap: 16px; align-items: center; }
    .summary-row.subtotal, .summary-row.vat { background: #fef9c3; font-weight: 600; color: #171717; }
    .summary-row.total { background: #fef9c3; font-size: 15px; font-weight: 700; color: #171717; border-top: 2px solid #e5e5e5; }
    .summary-row .amount { font-weight: 700; }
    .notes-section { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e5e5; text-align: right; }
    .notes-title { font-size: 13px; font-weight: 700; color: #171717; margin-bottom: 8px; }
    .notes-content { font-size: 12px; color: #525252; line-height: 1.6; white-space: pre-line; margin-bottom: 10px; }
    .notes-validity { font-size: 11px; color: #737373; margin: 8px 0; }
    .pdf-footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; }
    .footer-company { font-weight: 600; color: #171717; }
    .footer-signature { text-align: left; }
    .footer-client-name { display: block; font-weight: 600; color: #171717; margin-bottom: 4px; }
    .footer-line { display: block; font-size: 11px; color: #737373; letter-spacing: 2px; }
    @media print { body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .container { max-width: 100%; } }
  </style>
</head>
<body>
  <div class="container">
    ${profileBlock}
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
    <style>${getQuoteStyles("'Heebo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")}</style>
    <div class="quote-pdf-body" dir="rtl">
      <div class="container">
        ${profileBlock}
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
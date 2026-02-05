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
  const customerLines: string[] = [];
  if (customerName?.trim()) customerLines.push(`שם: ${escapeHtml(customerName.trim())}`);
  if (customerPhone?.trim()) customerLines.push(`טלפון: ${escapeHtml(customerPhone.trim())}`);
  if (customerEmail?.trim()) customerLines.push(`אימייל: ${escapeHtml(customerEmail.trim())}`);
  if (customerAddress?.trim()) customerLines.push(`כתובת: ${escapeHtml(customerAddress.trim())}`);
  const clientBlock = hasCustomer
    ? `<div class="client-block"><div class="client-label">ל:</div><div class="client-lines">${customerLines.join('<br>')}</div></div>`
    : '<div class="client-block"><div class="client-label">ל:</div><div class="client-lines">—</div></div>';

  const days = validityDays != null && validityDays >= 1 ? validityDays : 30;
  const validityText = `הצעת מחיר זו תקפה ל-${days} יום מיום הנפקתה`;
  const invoiceNum = quoteNumber != null ? String(quoteNumber) : '—';
  const metaLine = `חשבונית: ${invoiceNum} &nbsp; תאריך: ${today}`;

  const companyLines: string[] = [];
  if (profile?.businessName) companyLines.push(`<div class="company-name">${escapeHtml(profile.businessName)}</div>`);
  if (profile?.address) companyLines.push(`<div class="company-line">${escapeHtml(profile.address)}</div>`);
  if (profile?.phone) companyLines.push(`<div class="company-line">${escapeHtml(profile.phone)}</div>`);
  if (profile?.email) companyLines.push(`<div class="company-line">${escapeHtml(profile.email)}</div>`);
  const companyBlock =
    companyLines.length > 0
      ? `<div class="company-block">${companyLines.join('')}<div class="company-meta">${metaLine}</div></div>`
      : `<div class="company-block"><div class="company-meta">${metaLine}</div></div>`;

  const headerLeft = hasProfile(profile)
    ? `<div class="header-left">${profile!.logo ? `<img src="${profile!.logo}" alt="לוגו" class="header-logo" />` : '<div class="header-logo-placeholder">לוגו</div>'}${clientBlock}</div>`
    : `<div class="header-left">${clientBlock}</div>`;
  const headerRight = `<div class="header-right"><h1 class="quote-title">${escapeHtml(titleText)}</h1>${companyBlock}</div>`;
  const profileBlock = `<div class="letterhead">${headerLeft}${headerRight}</div>`;

  const notesText = notes?.trim() ?? '';
  const notesBlock = `<div class="notes-section"><div class="notes-title">הערות:</div>${notesText ? `<div class="notes-content">${escapeHtml(notesText).replace(/\n/g, '<br>')}</div>` : '<div class="notes-content">—</div>'}${validityText ? `<p class="notes-validity">${escapeHtml(validityText)}</p>` : ''}<p class="notes-signature">בכפוף לחתימת חוזה בין הצדדים.</p><div class="signature-line">אישור הצעת מחיר</div></div>`;

  const VAT = totalBeforeVAT * 0.18;
  return {
    profileBlock,
    notesBlock,
    validityText,
    today,
    items,
    totalBeforeVAT,
    VAT,
    totalWithVAT,
  };
}

/** מחזיר את מחרוזת ה-CSS להצעת המחיר – עיצוב נקי ופרופורציונלי לפי מוקאפ. */
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
    .letterhead {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 32px;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e5e5;
      text-align: right;
    }
    .header-left { flex-shrink: 0; text-align: right; }
    .header-logo { width: 56px; height: 56px; object-fit: contain; display: block; margin: 0 0 14px 0; }
    .header-logo-placeholder {
      width: 56px; height: 56px; background: #f0f0f0; border: 1px dashed #ccc;
      display: flex; align-items: center; justify-content: center; font-size: 11px; color: #737373; margin-bottom: 14px;
    }
    .client-block { font-size: 12px; color: #333; }
    .client-label { font-weight: 700; margin-bottom: 6px; color: #171717; }
    .client-lines { line-height: 1.7; }
    .header-right { flex: 1; }
    .quote-title {
      font-size: 24px;
      font-weight: 700;
      color: #171717;
      margin-bottom: 14px;
      letter-spacing: -0.02em;
    }
    .company-block { font-size: 12px; color: #525252; line-height: 1.7; }
    .company-name { font-weight: 600; font-size: 14px; color: #171717; margin-bottom: 4px; }
    .company-line { margin-top: 2px; }
    .company-meta { margin-top: 10px; font-size: 11px; color: #737373; }
    .items-table {
      width: 100%; border-collapse: collapse; margin-bottom: 24px; table-layout: fixed;
    }
    .items-table thead th {
      background: #1a1a2e; color: #fff; padding: 12px 14px; text-align: right;
      font-weight: 600; font-size: 11px;
    }
    .items-table thead th:nth-child(1) { width: 50%; }
    .items-table thead th:nth-child(2) { width: 14%; text-align: center; }
    .items-table thead th:nth-child(3) { width: 18%; text-align: left; }
    .items-table thead th:nth-child(4) { width: 18%; text-align: left; }
    .items-table tbody td {
      padding: 12px 14px; border-bottom: 1px solid #e5e5e5; vertical-align: middle; font-size: 12px; line-height: 1.5;
    }
    .items-table tbody tr:last-child td { border-bottom: 2px solid #1a1a2e; }
    .item-name { font-weight: 600; color: #171717; }
    .item-extras { font-size: 11px; color: #525252; margin-top: 4px; }
    .items-table .price-cell { text-align: left; font-weight: 600; color: #171717; white-space: nowrap; }
    .summary { max-width: 260px; margin: 0 0 0 auto; border: 1px solid #e5e5e5; overflow: hidden; }
    .summary-row { display: flex; justify-content: space-between; padding: 10px 14px; font-size: 13px; gap: 16px; align-items: center; }
    .summary-row.subtotal { background: #fef9c3; font-weight: 600; color: #171717; }
    .summary-row.vat { background: #fef9c3; font-weight: 600; color: #171717; }
    .summary-row.total { background: #fef9c3; font-size: 15px; font-weight: 700; color: #171717; border-top: 2px solid #e5e5e5; }
    .summary-row .amount { font-weight: 700; }
    .notes-section { margin-top: 28px; padding: 16px 0 0; border-top: 1px solid #e5e5e5; text-align: right; }
    .notes-title { font-size: 13px; font-weight: 700; color: #171717; margin-bottom: 8px; }
    .notes-content { font-size: 12px; color: #525252; line-height: 1.6; white-space: pre-line; margin-bottom: 10px; }
    .notes-validity { font-size: 11px; color: #737373; margin: 8px 0; }
    .notes-signature { font-size: 12px; color: #525252; margin: 12px 0 8px; }
    .signature-line { font-size: 12px; font-weight: 600; color: #171717; margin-top: 24px; padding-top: 8px; border-top: 1px solid #e5e5e5; }
    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e5e5; text-align: center; color: #a3a3a3; font-size: 11px; }
    .footer p { margin: 2px 0; }
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
  const { profileBlock, notesBlock, validityText, today, items: contentItems } = content;
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
    .letterhead { display: flex; align-items: flex-start; justify-content: space-between; gap: 32px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #e5e5e5; text-align: right; }
    .header-left { flex-shrink: 0; text-align: right; }
    .header-logo { width: 56px; height: 56px; object-fit: contain; display: block; margin-bottom: 14px; }
    .header-logo-placeholder { width: 56px; height: 56px; background: #f0f0f0; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #737373; margin-bottom: 14px; }
    .client-block { font-size: 12px; color: #333; }
    .client-label { font-weight: 700; margin-bottom: 6px; color: #171717; }
    .client-lines { line-height: 1.7; }
    .header-right { flex: 1; }
    .quote-title { font-size: 24px; font-weight: 700; color: #171717; margin-bottom: 14px; letter-spacing: -0.02em; }
    .company-block { font-size: 12px; color: #525252; line-height: 1.7; }
    .company-name { font-weight: 600; font-size: 14px; color: #171717; margin-bottom: 4px; }
    .company-line { margin-top: 2px; }
    .company-meta { margin-top: 10px; font-size: 11px; color: #737373; }
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
    .notes-signature { font-size: 12px; color: #525252; margin: 12px 0 8px; }
    .signature-line { font-size: 12px; font-weight: 600; color: #171717; margin-top: 24px; padding-top: 8px; border-top: 1px solid #e5e5e5; }
    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e5e5; text-align: center; color: #a3a3a3; font-size: 11px; }
    .footer p { margin: 2px 0; }
    @media print { body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .container { max-width: 100%; } }
  </style>
</head>
<body>
  <div class="container">
    ${profileBlock}
    <table class="items-table">
      <thead>
        <tr>
          <th>תיאור שירות/מוצר</th>
          <th>יחידות</th>
          <th>מחיר ליחידה</th>
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
    <div class="footer"></div>
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
  const { profileBlock, notesBlock, validityText, items: contentItems } = content;

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
              <th>תיאור שירות/מוצר</th>
              <th>יחידות</th>
              <th>מחיר ליחידה</th>
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
        <div class="footer"></div>
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
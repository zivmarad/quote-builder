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
  if (customerName?.trim()) customerLines.push(`<strong>${escapeHtml(customerName.trim())}</strong>`);
  if (customerPhone?.trim()) customerLines.push(`טלפון: ${escapeHtml(customerPhone.trim())}`);
  if (customerEmail?.trim()) customerLines.push(`אימייל: ${escapeHtml(customerEmail.trim())}`);
  if (customerAddress?.trim()) customerLines.push(`כתובת: ${escapeHtml(customerAddress.trim())}`);
  const customerLabel = customerName?.trim() ? 'לכבוד:' : 'פרטי לקוח:';
  const customerBlock = hasCustomer
    ? `<div class="customer-block"><span class="customer-label">${customerLabel}</span> ${customerLines.join('<br>')}</div>`
    : '';
  const days = validityDays != null && validityDays >= 1 ? validityDays : 30;
  const validityText = `הצעת מחיר זו תקפה ל-${days} יום מיום הנפקתה`;
  const profileBlock = hasProfile(profile)
    ? `
    <div class="letterhead">
      <div class="letterhead-right">
        <h1 class="letterhead-title">${escapeHtml(titleText)}</h1>
        ${profile!.businessName ? `<div class="letterhead-name">${escapeHtml(profile!.businessName)}</div>` : ''}
        ${profile!.contactName ? `<div class="letterhead-line">${escapeHtml(profile!.contactName)}</div>` : ''}
        ${profile!.address ? `<div class="letterhead-line">${escapeHtml(profile!.address)}</div>` : ''}
        ${profile!.phone ? `<div class="letterhead-line">${escapeHtml(profile!.phone)}</div>` : ''}
        ${profile!.email ? `<div class="letterhead-line">${escapeHtml(profile!.email)}</div>` : ''}
      </div>
      <div class="letterhead-left">
        ${profile!.logo ? `<img src="${profile!.logo}" alt="לוגו" class="letterhead-logo" />` : '<div class="letterhead-logo-placeholder">הלוגו שלך</div>'}
        <div class="letterhead-meta">
          <div class="letterhead-date">תאריך: ${today}</div>
        </div>
      </div>
    </div>
  `
    : `<div class="letterhead letterhead-no-profile"><h1 class="letterhead-title">${escapeHtml(titleText)}</h1><div class="letterhead-date">תאריך: ${today}</div></div>`;
  const notesText = notes?.trim() ?? '';
  const notesBlock = notesText
    ? `<div class="notes-section"><div class="notes-title">הערות:</div><div class="notes-content">${escapeHtml(notesText).replace(/\n/g, '<br>')}</div></div>`
    : '';
  const VAT = totalBeforeVAT * 0.18;
  return {
    profileBlock,
    customerBlock,
    notesBlock,
    validityText,
    today,
    items,
    totalBeforeVAT,
    VAT,
    totalWithVAT,
  };
}

/** מחזיר את מחרוזת ה-CSS להצעת המחיר. fontFamily מאפשר גופן עברי (Heebo) ב-PDF. */
function getQuoteStyles(fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif") {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .quote-pdf-body {
      font-family: ${fontFamily};
      direction: rtl;
      color: #171717;
      background: #fff;
      padding: 24px;
      font-size: 12px;
      line-height: 1.5;
      width: 560px;
    }
    .container { max-width: 560px; margin: 0 auto; }
    .letterhead {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e5e5;
      text-align: right;
    }
    .letterhead-right { flex: 1; }
    .letterhead-title {
      font-size: 22px;
      font-weight: 700;
      color: #171717;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    .letterhead-name { font-size: 15px; font-weight: 600; color: #171717; margin-bottom: 4px; }
    .letterhead-line { font-size: 12px; color: #525252; line-height: 1.6; margin-top: 2px; }
    .letterhead-left { text-align: center; flex-shrink: 0; }
    .letterhead-logo { width: 64px; height: 64px; object-fit: contain; display: block; margin: 0 auto 10px; }
    .letterhead-logo-placeholder {
      width: 64px; height: 64px; background: #f5f5f5; border: 1px dashed #d4d4d4;
      display: flex; align-items: center; justify-content: center; font-size: 11px; color: #737373; margin: 0 auto 10px;
    }
    .letterhead-meta { font-size: 12px; color: #525252; }
    .letterhead-date { margin-top: 4px; }
    .letterhead-no-profile { flex-direction: column; align-items: flex-end; }
    .letterhead-no-profile .letterhead-date { margin-top: 4px; }
    .customer-block { margin-bottom: 20px; padding: 10px 0; font-size: 13px; color: #171717; }
    .customer-label { margin-left: 6px; }
    .items-table {
      width: 100%; border-collapse: collapse; margin-bottom: 32px; table-layout: fixed;
    }
    .items-table thead th {
      background: #1e3a5f; color: #fff; padding: 12px 14px; text-align: right;
      font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .items-table thead th:nth-child(1) { width: 58%; }
    .items-table thead th:nth-child(2) { width: 22%; }
    .items-table thead th:nth-child(3) { width: 20%; text-align: left; }
    .items-table tbody td {
      padding: 14px 14px; border-bottom: 1px solid #e5e5e5; vertical-align: top; font-size: 12px; line-height: 1.5;
    }
    .items-table tbody tr:last-child td { border-bottom: 2px solid #171717; }
    .category-badge { display: inline-block; font-size: 11px; font-weight: 600; color: #525252; text-transform: uppercase; letter-spacing: 0.03em; }
    .item-name { font-size: 13px; font-weight: 600; color: #171717; }
    .extras-box { margin-top: 10px; padding-top: 10px; border-top: 1px solid #f5f5f5; }
    .extras-title { font-size: 11px; font-weight: 600; color: #737373; margin-bottom: 6px; }
    .extra-line { font-size: 12px; color: #525252; padding: 2px 0; display: flex; justify-content: space-between; }
    .price-cell { text-align: left; font-weight: 700; font-size: 14px; color: #171717; white-space: nowrap; }
    .override-badge { font-size: 10px; font-weight: 600; color: #737373; margin-top: 4px; }
    .summary { max-width: 200px; margin: 0 auto 0 0; padding: 8px 12px; border: 1px solid #e5e5e5; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #525252; gap: 12px; }
    .summary-row.subtotal { background: #fef9c3; font-weight: 600; color: #171717; }
    .summary-row.vat { background: #fff; }
    .summary-row.total { background: #fef9c3; font-size: 14px; font-weight: 700; color: #171717; border-top: 1px solid #e5e5e5; }
    .summary-row.total .amount { font-weight: 700; color: #171717; }
    .notes-section { margin-top: 24px; padding: 14px 0; border-top: 1px solid #e5e5e5; text-align: right; }
    .notes-title { font-size: 12px; font-weight: 700; color: #171717; margin-bottom: 8px; }
    .notes-content { font-size: 12px; color: #525252; line-height: 1.6; white-space: pre-line; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; text-align: center; color: #a3a3a3; font-size: 11px; line-height: 1.7; }
    .footer p { margin: 3px 0; }
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
  const { profileBlock, customerBlock, notesBlock, validityText, today, items: contentItems } = content;
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
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      direction: rtl;
      color: #171717;
      background: #fff;
      padding: 24px;
      font-size: 12px;
      line-height: 1.5;
    }
    .container { max-width: 560px; margin: 0 auto; }
    .letterhead {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e5e5;
      text-align: right;
    }
    .letterhead-right { flex: 1; }
    .letterhead-title {
      font-size: 22px;
      font-weight: 700;
      color: #171717;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    .letterhead-name { font-size: 15px; font-weight: 600; color: #171717; margin-bottom: 4px; }
    .letterhead-line { font-size: 12px; color: #525252; line-height: 1.6; margin-top: 2px; }
    .letterhead-left { text-align: center; flex-shrink: 0; }
    .letterhead-logo { width: 64px; height: 64px; object-fit: contain; display: block; margin: 0 auto 10px; }
    .letterhead-logo-placeholder {
      width: 64px; height: 64px; background: #f5f5f5; border: 1px dashed #d4d4d4;
      display: flex; align-items: center; justify-content: center; font-size: 11px; color: #737373; margin: 0 auto 10px;
    }
    .letterhead-meta { font-size: 12px; color: #525252; }
    .letterhead-date { margin-top: 4px; }
    .letterhead-no-profile { flex-direction: column; align-items: flex-end; }
    .customer-block { margin-bottom: 20px; padding: 10px 0; font-size: 13px; color: #171717; }
    .customer-label { margin-left: 6px; }
    .items-table {
      width: 100%; border-collapse: collapse; margin-bottom: 32px; table-layout: fixed;
    }
    .items-table thead th {
      background: #1e3a5f; color: #fff; padding: 12px 14px; text-align: right;
      font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .items-table thead th:nth-child(1) { width: 58%; }
    .items-table thead th:nth-child(2) { width: 22%; }
    .items-table thead th:nth-child(3) { width: 20%; text-align: left; }
    .items-table tbody td {
      padding: 14px 14px; border-bottom: 1px solid #e5e5e5; vertical-align: top; font-size: 12px; line-height: 1.5;
    }
    .items-table tbody tr:last-child td { border-bottom: 2px solid #171717; }
    .category-badge { display: inline-block; font-size: 11px; font-weight: 600; color: #525252; text-transform: uppercase; letter-spacing: 0.03em; }
    .item-name { font-size: 13px; font-weight: 600; color: #171717; }
    .extras-box { margin-top: 10px; padding-top: 10px; border-top: 1px solid #f5f5f5; }
    .extras-title { font-size: 11px; font-weight: 600; color: #737373; margin-bottom: 6px; }
    .extra-line { font-size: 12px; color: #525252; padding: 2px 0; display: flex; justify-content: space-between; }
    .price-cell { text-align: left; font-weight: 700; font-size: 14px; color: #171717; white-space: nowrap; }
    .override-badge { font-size: 10px; font-weight: 600; color: #737373; margin-top: 4px; }
    .summary { max-width: 200px; margin: 0 auto 0 0; padding: 8px 12px; border: 1px solid #e5e5e5; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #525252; gap: 12px; }
    .summary-row.subtotal { background: #fef9c3; font-weight: 600; color: #171717; }
    .summary-row.vat { background: #fff; }
    .summary-row.total { background: #fef9c3; font-size: 14px; font-weight: 700; color: #171717; border-top: 1px solid #e5e5e5; }
    .summary-row.total .amount { font-weight: 700; color: #171717; }
    .notes-section { margin-top: 24px; padding: 14px 0; border-top: 1px solid #e5e5e5; text-align: right; }
    .notes-title { font-size: 12px; font-weight: 700; color: #171717; margin-bottom: 8px; }
    .notes-content { font-size: 12px; color: #525252; line-height: 1.6; white-space: pre-line; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; text-align: center; color: #a3a3a3; font-size: 11px; line-height: 1.7; }
    .footer p { margin: 3px 0; }
    @media print {
      body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .container { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${profileBlock}
    ${customerBlock}
    
    <table class="items-table">
      <thead>
        <tr>
          <th>תיאור השירות / המוצר</th>
          <th>קטגוריה</th>
          <th>מחיר</th>
        </tr>
      </thead>
      <tbody>
        ${contentItems.map(item => {
          const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
          const calculatedPrice = item.basePrice + extrasTotal;
          const currentPrice = item.overridePrice ?? calculatedPrice;
          const hasExtras = item.extras && item.extras.length > 0;
          const isOverridden = item.overridePrice !== undefined;
          
          return `
            <tr>
              <td>
                <div class="item-name">${item.name}</div>
                ${!isOverridden && hasExtras ? `
                  <div class="extras-box">
                    <div class="extras-title">מחיר בסיס: ₪${item.basePrice.toLocaleString('he-IL')}</div>
                    ${item.extras!.map(extra => `
                      <div class="extra-line">
                        <span>+ ${extra.text}</span>
                        <span style="font-weight: 600;">₪${extra.price.toLocaleString('he-IL')}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </td>
              <td>
                <span class="category-badge">${item.category}</span>
              </td>
              <td class="price-cell">
                ₪${currentPrice.toLocaleString('he-IL')}
                ${isOverridden ? '<div class="override-badge">מחיר מותאם</div>' : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    
    <div class="summary">
      <div class="summary-row subtotal">
        <span>סה"כ</span>
        <strong>₪${totalBeforeVAT.toLocaleString('he-IL')}</strong>
      </div>
      <div class="summary-row vat">
        <span>מע"מ (18%)</span>
        <strong>₪${VAT.toLocaleString('he-IL')}</strong>
      </div>
      <div class="summary-row total">
        <span>סה"כ לתשלום</span>
        <span class="amount">₪${totalWithVAT.toLocaleString('he-IL')}</span>
      </div>
    </div>
    
    ${notesBlock}
    
    <div class="footer">
      <p><strong>תודה רבה על שבחרת בנו!</strong></p>
      <p>${validityText}</p>
      <p>לשאלות ובירורים ניתן ליצור קשר בכל עת</p>
    </div>
  </div>
  
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
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
  const { profileBlock, customerBlock, notesBlock, validityText, items: contentItems } = content;

  const tableRows = contentItems
    .map(
      (item) => {
        const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
        const calculatedPrice = item.basePrice + extrasTotal;
        const currentPrice = item.overridePrice ?? calculatedPrice;
        const hasExtras = item.extras && item.extras.length > 0;
        const isOverridden = item.overridePrice !== undefined;
        return `
          <tr>
            <td>
              <div class="item-name">${escapeHtml(item.name)}</div>
              ${!isOverridden && hasExtras ? `
                <div class="extras-box">
                  <div class="extras-title">מחיר בסיס: ₪${item.basePrice.toLocaleString('he-IL')}</div>
                  ${item.extras!.map((extra) => `
                    <div class="extra-line">
                      <span>+ ${escapeHtml(extra.text)}</span>
                      <span style="font-weight: 600;">₪${extra.price.toLocaleString('he-IL')}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </td>
            <td><span class="category-badge">${escapeHtml(item.category)}</span></td>
            <td class="price-cell">
              ₪${currentPrice.toLocaleString('he-IL')}
              ${isOverridden ? '<div class="override-badge">מחיר מותאם</div>' : ''}
            </td>
          </tr>
        `;
      }
    )
    .join('');

  const fragment = `
    <style>${getQuoteStyles("'Heebo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")}</style>
    <div class="quote-pdf-body" dir="rtl">
      <div class="container">
        ${profileBlock}
        ${customerBlock}
        <table class="items-table">
          <thead>
            <tr>
              <th>תיאור השירות / המוצר</th>
              <th>קטגוריה</th>
              <th>מחיר</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="summary">
          <div class="summary-row subtotal">
            <span>סה"כ</span>
            <strong>₪${totalBeforeVAT.toLocaleString('he-IL')}</strong>
          </div>
          <div class="summary-row vat">
            <span>מע"מ (18%)</span>
            <strong>₪${VAT.toLocaleString('he-IL')}</strong>
          </div>
          <div class="summary-row total">
            <span>סה"כ לתשלום</span>
            <span class="amount">₪${totalWithVAT.toLocaleString('he-IL')}</span>
          </div>
        </div>
        ${notesBlock}
        <div class="footer">
          <p><strong>תודה רבה על שבחרת בנו!</strong></p>
          <p>${validityText}</p>
        </div>
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { type QuoteDiscount } from '../../../lib/quote-discount';
import {
  type BasketItem,
  type QuoteProfile,
  buildQuoteContent,
  buildSummaryHtml,
  getQuoteStyles,
  rowToHtml,
  ROWS_PER_PAGE,
} from './quotePreview';

export type { BasketItem, QuoteProfile } from './quotePreview';

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
  vatRate?: number,
  subtotalBeforeDiscount?: number,
  discountAmount?: number,
  discount?: QuoteDiscount | null
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
    subtotalBeforeDiscount,
    discountAmount,
    discount,
  });
  const { profileBlock, notesBlock, footerBlock, items: contentItems, subtotalBeforeDiscount: sub, discountAmount: discAmt, discount: disc } = content;

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
        ${buildSummaryHtml(
          { subtotalBeforeDiscount: sub, discountAmount: discAmt, discount: disc, totalBeforeVAT, VAT, totalWithVAT },
          vatLabel
        )}
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

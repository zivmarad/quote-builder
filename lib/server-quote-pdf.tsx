import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { formatDiscountLabel, type QuoteDiscount } from './quote-discount';

export interface ServerQuoteItem {
  name: string;
  basePrice: number;
  quantity?: number;
  unit?: string;
  overridePrice?: number;
  extras?: Array<{ text: string; price: number }>;
}

export interface ServerQuoteSnapshot {
  quoteTitle: string;
  quoteNumber?: number;
  createdAt: string;
  vatRate: number;
  validityDays: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCompanyId?: string;
  notes?: string;
  profile: {
    businessName?: string;
    contactName?: string;
    companyId?: string;
    phone?: string;
    email?: string;
    address?: string;
    logo?: string;
  };
  items: ServerQuoteItem[];
  totals: {
    subtotalBeforeDiscount?: number;
    discountAmount?: number;
    discount?: QuoteDiscount;
    totalBeforeVAT: number;
    vat: number;
    totalWithVAT: number;
  };
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, direction: 'rtl' },
  title: { fontSize: 18, marginBottom: 8, fontWeight: 'bold' as const, textAlign: 'right' as const },
  section: { marginBottom: 10 },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 3 },
  label: { color: '#555' },
  value: { color: '#111' },
  divider: { borderBottom: '1 solid #ddd', marginVertical: 8 },
  tableHeader: { flexDirection: 'row-reverse', borderBottom: '1 solid #999', paddingBottom: 4, marginBottom: 4, fontWeight: 'bold' as const },
  cellDesc: { width: '50%', textAlign: 'right' as const },
  cellQty: { width: '15%', textAlign: 'center' as const },
  cellUnit: { width: '15%', textAlign: 'center' as const },
  cellTotal: { width: '20%', textAlign: 'left' as const },
  tableRow: { flexDirection: 'row-reverse', borderBottom: '1 solid #eee', paddingVertical: 4 },
  extra: { color: '#666', fontSize: 9, marginTop: 2 },
});

const money = (v: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(v);

function itemFinalPrice(item: ServerQuoteItem): number {
  if (typeof item.overridePrice === 'number') return item.overridePrice;
  const extras = item.extras?.reduce((s, e) => s + (typeof e.price === 'number' ? e.price : 0), 0) ?? 0;
  return (item.basePrice || 0) + extras;
}

export async function generateServerQuotePdf(snapshot: ServerQuoteSnapshot): Promise<Buffer> {
  const quoteDate = new Date(snapshot.createdAt || Date.now()).toLocaleDateString('he-IL');
  const vatLabel = snapshot.vatRate === 0 ? 'עוסק פטור' : `מע"מ (${Math.round(snapshot.vatRate * 100)}%)`;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          {snapshot.quoteTitle || 'הצעת מחיר'} {snapshot.quoteNumber ? `#${snapshot.quoteNumber}` : ''}
        </Text>

        <View style={styles.section}>
          <View style={styles.row}><Text style={styles.label}>תאריך:</Text><Text style={styles.value}>{quoteDate}</Text></View>
          <View style={styles.row}><Text style={styles.label}>לקוח:</Text><Text style={styles.value}>{snapshot.customerName || '—'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>טלפון:</Text><Text style={styles.value}>{snapshot.customerPhone || '—'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>אימייל:</Text><Text style={styles.value}>{snapshot.customerEmail || '—'}</Text></View>
        </View>

        <View style={styles.divider} />

        <View style={styles.tableHeader}>
          <Text style={styles.cellDesc}>שירות</Text>
          <Text style={styles.cellQty}>כמות</Text>
          <Text style={styles.cellUnit}>יחידה</Text>
          <Text style={styles.cellTotal}>סה״כ</Text>
        </View>

        {snapshot.items.map((item, idx) => {
          const qty = item.quantity ?? 1;
          const total = itemFinalPrice(item);
          return (
            <View key={`${item.name}-${idx}`} style={styles.tableRow}>
              <View style={styles.cellDesc}>
                <Text>{item.name}</Text>
                {(item.extras ?? []).map((ex, i) => (
                  <Text key={`${idx}-ex-${i}`} style={styles.extra}>• {ex.text}</Text>
                ))}
              </View>
              <Text style={styles.cellQty}>{String(qty)}</Text>
              <Text style={styles.cellUnit}>{item.unit || 'יח׳'}</Text>
              <Text style={styles.cellTotal}>{money(total)}</Text>
            </View>
          );
        })}

        <View style={styles.divider} />

        <View style={styles.section}>
          {(snapshot.totals.discountAmount ?? 0) > 0 && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>סיכום ביניים:</Text>
                <Text style={styles.value}>{money(snapshot.totals.subtotalBeforeDiscount ?? snapshot.totals.totalBeforeVAT + (snapshot.totals.discountAmount ?? 0))}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: '#15803d' }]}>
                  {snapshot.totals.discount ? formatDiscountLabel(snapshot.totals.discount) : 'הנחה'}:
                </Text>
                <Text style={[styles.value, { color: '#15803d' }]}>-{money(snapshot.totals.discountAmount ?? 0)}</Text>
              </View>
            </>
          )}
          <View style={styles.row}><Text style={styles.label}>סה״כ לפני מע״מ:</Text><Text style={styles.value}>{money(snapshot.totals.totalBeforeVAT)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>{vatLabel}:</Text><Text style={styles.value}>{money(snapshot.totals.vat)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>סה״כ לתשלום:</Text><Text style={styles.value}>{money(snapshot.totals.totalWithVAT)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>תוקף הצעה:</Text><Text style={styles.value}>{snapshot.validityDays} ימים</Text></View>
        </View>

        {!!snapshot.notes && (
          <View style={styles.section}>
            <Text style={styles.label}>הערות:</Text>
            <Text style={styles.value}>{snapshot.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}

import { supabaseAdmin } from './supabase-server';

export const PRODUCT_EVENT_NAMES = [
  'app_entered',
  'quote_pdf',
  'quote_whatsapp',
  'template_word',
  'template_excel',
  'template_pdf',
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export type ProductEventCount = {
  total: number;
  last7d: number;
};

export type ProductEventStats = {
  tableMissing: boolean;
  appEntered: ProductEventCount;
  quotePdf: ProductEventCount;
  quoteWhatsapp: ProductEventCount;
  templateWord: ProductEventCount;
  templateExcel: ProductEventCount;
  templatePdf: ProductEventCount;
};

const STAT_KEYS = [
  ['appEntered', 'app_entered'],
  ['quotePdf', 'quote_pdf'],
  ['quoteWhatsapp', 'quote_whatsapp'],
  ['templateWord', 'template_word'],
  ['templateExcel', 'template_excel'],
  ['templatePdf', 'template_pdf'],
] as const;

export function isProductEventName(value: unknown): value is ProductEventName {
  return typeof value === 'string' && (PRODUCT_EVENT_NAMES as readonly string[]).includes(value);
}

function emptyCount(): ProductEventCount {
  return { total: 0, last7d: 0 };
}

export function emptyProductEventStats(tableMissing = true): ProductEventStats {
  return {
    tableMissing,
    appEntered: emptyCount(),
    quotePdf: emptyCount(),
    quoteWhatsapp: emptyCount(),
    templateWord: emptyCount(),
    templateExcel: emptyCount(),
    templatePdf: emptyCount(),
  };
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? '';
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('Could not find the table') ||
    msg.includes('schema cache')
  );
}

export async function insertProductEvent(name: ProductEventName): Promise<void> {
  if (!supabaseAdmin) return;
  const { error } = await supabaseAdmin.from('product_events').insert({ name });
  if (error && !isMissingTableError(error)) {
    console.error('insert product_events:', error);
  }
}

async function countEvent(name: ProductEventName, since?: string): Promise<{ count: number; missing: boolean }> {
  if (!supabaseAdmin) return { count: 0, missing: true };
  let query = supabaseAdmin.from('product_events').select('*', { count: 'exact', head: true }).eq('name', name);
  if (since) query = query.gte('created_at', since);
  const { count, error } = await query;
  if (isMissingTableError(error)) return { count: 0, missing: true };
  if (error) {
    console.error('count product_events:', name, error);
    return { count: 0, missing: false };
  }
  return { count: count ?? 0, missing: false };
}

export async function getProductEventStats(): Promise<ProductEventStats> {
  if (!supabaseAdmin) return emptyProductEventStats(true);

  const probe = await supabaseAdmin.from('product_events').select('id').limit(1);
  if (isMissingTableError(probe.error)) return emptyProductEventStats(true);
  if (probe.error) {
    console.error('product_events probe:', probe.error);
    return emptyProductEventStats(false);
  }

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const stats = emptyProductEventStats(false);
  const results = await Promise.all(
    STAT_KEYS.flatMap(([statKey, name]) => [
      countEvent(name).then((r) => ({ statKey, period: 'total' as const, count: r.count })),
      countEvent(name, since7d).then((r) => ({ statKey, period: 'last7d' as const, count: r.count })),
    ]),
  );

  for (const row of results) {
    stats[row.statKey][row.period] = row.count;
  }
  return stats;
}

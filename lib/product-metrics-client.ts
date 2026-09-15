import type { ProductEventName } from './product-events';

/**
 * שולח אירוע קליק לדשבורד המנהל. לא חוסם את המשתמש אם הרשת נכשלת.
 */
export function recordProductMetric(name: ProductEventName): void {
  try {
    const body = JSON.stringify({ name });
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/api/metrics', blob)) return;
    }
    void fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
  } catch {
    /* ignore – ספירה לעולם לא תשבור flow */
  }
}

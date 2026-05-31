import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatShekel, type PriceRow, type SeoFaq } from '@/lib/seo-content';

/** פירורי לחם נגישים + ויזואליים (ה-JSON-LD נפרד). */
export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="פירורי לחם" className="text-sm text-slate-500 mb-6">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {item.href ? (
              <Link href={item.href} className="hover:text-slate-800 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-700 font-medium">{item.label}</span>
            )}
            {i < items.length - 1 && <span className="text-slate-300">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** טבלת מחירי ייחוס. */
export function PriceTable({ rows }: { rows: PriceRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-right">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-sm">
            <th className="px-4 py-3 font-semibold">סוג עבודה</th>
            <th className="px-4 py-3 font-semibold whitespace-nowrap">מחיר מ-</th>
            <th className="px-4 py-3 font-semibold">יחידה</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.name}
              className={i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}
            >
              <td className="px-4 py-3 text-slate-800 font-medium">{row.name}</td>
              <td className="px-4 py-3 text-[#2563eb] font-bold whitespace-nowrap">
                {formatShekel(row.price)}
              </td>
              <td className="px-4 py-3 text-slate-500 text-sm whitespace-nowrap">{row.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** רשימת שאלות נפוצות (סטטית, נגישה, מתאימה ל-FAQ schema). */
export function SeoFaqList({ items }: { items: SeoFaq[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-slate-200 bg-white px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="cursor-pointer font-bold text-slate-900 list-none flex items-center justify-between gap-3">
            <span>{item.question}</span>
            <span className="text-slate-300 group-open:rotate-45 transition-transform text-xl leading-none">
              +
            </span>
          </summary>
          <p className="mt-2 text-slate-600 text-sm leading-relaxed">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

/** בלוק קריאה לפעולה – מפנה לכלי / להרשמה. */
export function SeoCta({
  title = 'בנה הצעת מחיר מקצועית עכשיו',
  subtitle = 'חינם, בלי כרטיס אשראי. PDF ממותג ושליחה בוואטסאפ ב-60 שניות.',
  href = '/?try=1',
  cta = 'נסה עכשיו בחינם',
}: {
  title?: string;
  subtitle?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <section className="my-12 rounded-3xl bg-gradient-to-b from-blue-50 to-white border border-blue-100 px-6 py-10 text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-2">{title}</h2>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">{subtitle}</p>
      <Link
        href={href}
        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-all text-lg shadow-lg shadow-blue-600/25 hover:shadow-xl"
      >
        {cta}
        <ArrowLeft size={20} aria-hidden />
      </Link>
    </section>
  );
}

/** עוטף סקריפט JSON-LD בודד. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** בונה אובייקט BreadcrumbList ל-schema.org. */
export function buildBreadcrumbJsonLd(
  items: { label: string; url: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.url,
    })),
  };
}

/** בונה אובייקט FAQPage ל-schema.org. */
export function buildFaqJsonLd(items: SeoFaq[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

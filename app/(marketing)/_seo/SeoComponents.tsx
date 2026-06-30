import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  formatShekel,
  type ContentSection,
  type PriceRow,
  type SeoFaq,
} from '@/lib/seo-content';
import { resolvePriceRowHref } from '@/lib/seo-price-links';

/** סעיפי תוכן מעמיקים (H2 + פסקאות + רשימה אופציונלית). */
export function ContentSections({ sections }: { sections: ContentSection[] }) {
  return (
    <div className="mt-12 space-y-10">
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-2xl font-bold text-[#0F172A] mb-4">{section.heading}</h2>
          {section.paragraphs?.map((p, i) => (
            <p key={i} className="text-slate-600 leading-relaxed mb-3">
              {p}
            </p>
          ))}
          {section.list && (
            <ul className="mt-3 space-y-2">
              {section.list.map((item, i) => (
                <li key={i} className="flex gap-2 text-slate-600 leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563eb]" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

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

/** טבלת מחירי ייחוס – שם העבודה מקשר לאשף בניית ההצעה; המחיר עצמו סטטי. */
export function PriceTable({
  rows,
  categoryId,
}: {
  rows: PriceRow[];
  categoryId?: string;
}) {
  const hasLinks = Boolean(categoryId);

  return (
    <div>
      {hasLinks && (
        <p className="text-sm text-slate-500 mb-3">
          המחירים לייחוס בלבד. לבניית הצעה — לחצו על{' '}
          <span className="font-medium text-slate-700">סוג העבודה</span>.
        </p>
      )}
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
            {rows.map((row, i) => {
              const href = resolvePriceRowHref(categoryId, row);
              return (
                <tr
                  key={row.name}
                  className={i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}
                >
                  <td className="px-4 py-3 font-medium">
                    {href ? (
                      <Link
                        href={href}
                        className="group inline-flex items-center gap-1.5 text-[#2563eb] hover:text-[#1d4ed8] hover:underline underline-offset-2"
                      >
                        <span>{row.name}</span>
                        <ArrowLeft
                          size={14}
                          className="opacity-0 -translate-x-0.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0"
                          aria-hidden
                        />
                      </Link>
                    ) : (
                      <span className="text-slate-800">{row.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-bold whitespace-nowrap tabular-nums">
                    {formatShekel(row.price)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm whitespace-nowrap">{row.unit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
  subtitle = 'חינם, בלי כרטיס אשראי. הרשמה קצרה לייצוא PDF ושליחה בוואטסאפ.',
  href = '/?try=1',
  cta = 'נסה עכשיו בחינם',
  secondaryHref,
  secondaryCta,
}: {
  title?: string;
  subtitle?: string;
  href?: string;
  cta?: string;
  secondaryHref?: string;
  secondaryCta?: string;
}) {
  return (
    <section className="my-12 rounded-3xl bg-gradient-to-b from-blue-50 to-white border border-blue-100 px-6 py-10 text-center">
      <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-2">{title}</h2>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">{subtitle}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] transition-all text-lg shadow-lg shadow-blue-600/25 hover:shadow-xl"
        >
          {cta}
          <ArrowLeft size={20} aria-hidden />
        </Link>
        {secondaryHref && secondaryCta && (
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-[#2563eb] bg-white border border-blue-200 hover:bg-blue-50 transition-all"
          >
            {secondaryCta}
          </Link>
        )}
      </div>
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

/** בונה ItemList למחירון – מסייע לגוגל להציג rich snippets. */
export function buildPriceListJsonLd(
  pageName: string,
  pageUrl: string,
  rows: PriceRow[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: pageName,
    ...(pageUrl ? { url: pageUrl } : {}),
    itemListElement: rows.map((row, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: row.name,
        offers: {
          '@type': 'Offer',
          price: row.price,
          priceCurrency: 'ILS',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: row.price,
            priceCurrency: 'ILS',
            unitText: row.unit,
          },
        },
      },
    })),
  };
}

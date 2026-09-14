import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { withSiteMetadata } from '@/lib/site-metadata';
import { absoluteUrl } from '@/lib/site-url';
import { PRICE_LIST_PAGES, INDUSTRY_PAGES } from '@/lib/seo-content';
import { Breadcrumbs, JsonLd, SeoHeroCta, SeoStartByTrade, buildBreadcrumbJsonLd } from '../_seo/SeoComponents';

export const metadata: Metadata = withSiteMetadata('/pricing', {
  title: 'מחירונים לבעלי מקצוע 2026 | אינסטלציה, חשמל, צבע ושיפוצים',
  description:
    'מחירונים מעודכנים 2026 לבעלי מקצוע: שיפוץ דירה, שיפוץ מקלחת, אינסטלציה, חשמל, צבע, ריצוף, מיזוג, גבס ונגרות. טווחי מחירים מקובלים + כלי חינמי לבניית הצעת מחיר.',
});

export default function PriceListHubPage() {
  const breadcrumbItems = [
    { label: 'דף הבית', url: absoluteUrl('/landing') ?? '/landing' },
    { label: 'מחירונים', url: absoluteUrl('/pricing') ?? '/pricing' },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <main className="min-h-screen bg-[#F8FAFC]" dir="rtl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Breadcrumbs items={[{ label: 'דף הבית', href: '/landing' }, { label: 'מחירונים' }]} />

          <h1 className="text-2xl sm:text-4xl font-black text-[#0F172A] leading-tight mb-3">
            מחירונים לבעלי מקצוע (2026)
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-5">
            טווחי מחירים מקובלים בישראל לפי ענף – נקודת ייחוס לתמחור. כדי לבנות הצעת מחיר
            מדויקת ללקוח, השתמש בבונה הצעות המחיר.
          </p>

          <SeoHeroCta />
          <SeoStartByTrade />

          <div className="grid sm:grid-cols-2 gap-4">
            {PRICE_LIST_PAGES.map((list) => (
              <Link
                key={list.slug}
                href={`/pricing/${list.slug}`}
                className="group block rounded-2xl border border-slate-200 bg-white p-6 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <h2 className="text-lg font-bold text-[#0F172A] mb-2 group-hover:text-[#2563eb] transition-colors">
                  {list.h1}
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">{list.excerpt}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563eb]">
                  צפה במחירון
                  <ArrowLeft size={16} aria-hidden />
                </span>
              </Link>
            ))}
          </div>

          <section className="mt-14">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-3">בנה הצעת מחיר לפי ענף</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              רוצה מעבר למחירון? בחר ענף וקבל דף ייעודי עם מחירון וכלי חינמי לבניית הצעת מחיר
              מסודרת ללקוח.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {INDUSTRY_PAGES.map((industry) => (
                <Link
                  key={industry.slug}
                  href={`/price-quote/${industry.slug}`}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:border-blue-300 hover:text-[#2563eb] transition-colors"
                >
                  הצעת מחיר ל{industry.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

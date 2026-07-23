import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { withSiteMetadata } from '@/lib/site-metadata';
import { absoluteUrl } from '@/lib/site-url';
import {
  INDUSTRY_PAGES,
  getIndustryBySlug,
  getPriceListsForIndustry,
  getPriceListBySlug,
} from '@/lib/seo-content';
import { ArrowLeft } from 'lucide-react';
import {
  Breadcrumbs,
  ContentSections,
  PriceTable,
  SeoFaqList,
  SeoCta,
  JsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from '../../_seo/SeoComponents';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return INDUSTRY_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getIndustryBySlug(slug);
  if (!page) return {};
  return withSiteMetadata(`/price-quote/${page.slug}`, {
    title: page.metaTitle,
    description: page.metaDescription,
    openGraph: { title: page.h1, description: page.metaDescription },
  });
}

export default async function IndustryPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getIndustryBySlug(slug);
  if (!page) notFound();

  const pageUrl = absoluteUrl(`/price-quote/${page.slug}`) ?? '';
  const relatedPriceLists = getPriceListsForIndustry(page.slug);
  /** דף המחירון התואם – לקישור הדדי ולמניעת קניבליזציה (price-quote=כלי, pricing=מחירון). */
  const matchingPriceList = getPriceListBySlug(page.slug);
  const breadcrumbItems = [
    { label: 'דף הבית', url: absoluteUrl('/landing') ?? '/landing' },
    { label: page.h1, url: pageUrl },
  ];

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.h1,
    serviceType: page.label,
    areaServed: 'IL',
    description: page.metaDescription,
    provider: { '@type': 'Organization', name: 'בונה הצעות מחיר' },
    ...(pageUrl ? { url: pageUrl } : {}),
  };

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={serviceJsonLd} />
      <JsonLd data={buildFaqJsonLd(page.faq)} />

      <main className="min-h-screen bg-[#F8FAFC]" dir="rtl">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Breadcrumbs
            items={[{ label: 'דף הבית', href: '/landing' }, { label: page.h1 }]}
          />

          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] leading-tight mb-4">
            {page.h1}
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-4">{page.intro}</p>
          <p className="text-slate-600 leading-relaxed mb-8">{page.body}</p>

          <h2 className="text-2xl font-bold text-[#0F172A] mb-4">
            כמה עולה {page.label}? טווחי מחיר לבניית הצעה
          </h2>
          <p className="text-slate-600 mb-5 text-sm">
            המחירים הם נקודת פתיחה מקובלת בישראל ומשתנים לפי תנאי השטח. לחצו על סוג העבודה כדי
            להתחיל לבנות הצעה – מסמנים תוספות והסכום מתעדכן אוטומטית.
          </p>
          <PriceTable rows={page.prices} categoryId={page.categoryId} />

          {matchingPriceList && (
            <Link
              href={`/pricing/${matchingPriceList.slug}`}
              className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <span className="text-sm text-slate-700">
                רוצה את <span className="font-bold text-slate-900">{matchingPriceList.h1}</span> המלא, עם כל טווחי המחיר והסברים?
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563eb] whitespace-nowrap">
                למחירון המלא
                <ArrowLeft size={16} aria-hidden />
              </span>
            </Link>
          )}

          {page.sections && <ContentSections sections={page.sections} />}

          <SeoCta
            title={`בנה הצעת מחיר ל${page.label} עכשיו`}
            href={`/category/${page.categoryId}`}
            cta={`בחר עבודות ל${page.label}`}
          />

          <div className="my-12">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">שאלות נפוצות</h2>
            <SeoFaqList items={page.faq} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-700 font-medium mb-4">רוצה לראות עוד מחירונים ומדריכים?</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {relatedPriceLists.map((priceList) => (
                <Link
                  key={priceList.slug}
                  href={`/pricing/${priceList.slug}`}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                >
                  {priceList.h1}
                </Link>
              ))}
              <Link
                href="/guides"
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                מדריכים להצעות מחיר
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                כל המחירונים
              </Link>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}

import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { withSiteMetadata } from '@/lib/site-metadata';
import { absoluteUrl } from '@/lib/site-url';
import { INDUSTRY_PAGES, getIndustryBySlug } from '@/lib/seo-content';
import {
  Breadcrumbs,
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
          <p className="text-slate-600 leading-relaxed">{page.body}</p>

          <SeoCta />

          <h2 className="text-2xl font-bold text-[#0F172A] mb-4">
            מחירון {page.label} – טווחי ייחוס
          </h2>
          <p className="text-slate-600 mb-5 text-sm">
            המחירים הם נקודת פתיחה מקובלת בישראל ומשתנים לפי תנאי השטח. בכלי מסמנים את
            התוספות והסכום מתעדכן אוטומטית.
          </p>
          <PriceTable rows={page.prices} />

          <div className="my-12">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">שאלות נפוצות</h2>
            <SeoFaqList items={page.faq} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-700 font-medium mb-4">רוצה לראות עוד מחירונים ומדריכים?</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link
                href={`/pricing/${page.slug}`}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                מחירון {page.label}
              </Link>
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

import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { withSiteMetadata } from '@/lib/site-metadata';
import { absoluteUrl } from '@/lib/site-url';
import { PRICE_LIST_PAGES, getPriceListBySlug } from '@/lib/seo-content';
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
  return PRICE_LIST_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPriceListBySlug(decodeURIComponent(slug));
  if (!page) return {};
  return withSiteMetadata(`/מחירון/${page.slug}`, {
    title: page.metaTitle,
    description: page.metaDescription,
    openGraph: { title: page.h1, description: page.metaDescription },
  });
}

export default async function PriceListPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getPriceListBySlug(decodeURIComponent(slug));
  if (!page) notFound();

  const pageUrl = absoluteUrl(`/מחירון/${page.slug}`) ?? '';
  const breadcrumbItems = [
    { label: 'דף הבית', url: absoluteUrl('/landing') ?? '/landing' },
    { label: 'מחירונים', url: absoluteUrl('/מחירון') ?? '/מחירון' },
    { label: page.h1, url: pageUrl },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={buildFaqJsonLd(page.faq)} />

      <main className="min-h-screen bg-[#F8FAFC]" dir="rtl">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Breadcrumbs
            items={[
              { label: 'דף הבית', href: '/landing' },
              { label: 'מחירונים', href: '/מחירון' },
              { label: page.h1 },
            ]}
          />

          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] leading-tight mb-4">
            {page.h1}
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">{page.intro}</p>

          <PriceTable rows={page.prices} />
          <p className="mt-3 text-xs text-slate-400">
            * המחירים הם טווחי ייחוס להמחשה (2026) ואינם מחיר מחייב. התמחור בפועל משתנה לפי תנאי
            השטח.
          </p>

          <SeoCta
            title={`בנה הצעת מחיר ${page.relatedIndustrySlug ? `ל${page.relatedIndustrySlug}` : ''} עכשיו`}
          />

          <div className="my-12">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">שאלות נפוצות</h2>
            <SeoFaqList items={page.faq} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-700 font-medium mb-4">קישורים שימושיים</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {page.relatedIndustrySlug && (
                <Link
                  href={`/הצעת-מחיר/${page.relatedIndustrySlug}`}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                >
                  הצעת מחיר ל{page.relatedIndustrySlug}
                </Link>
              )}
              <Link
                href="/מחירון"
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                כל המחירונים
              </Link>
              <Link
                href="/מדריכים"
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                מדריכים להצעות מחיר
              </Link>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}

import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { withSiteMetadata } from '@/lib/site-metadata';
import { absoluteUrl } from '@/lib/site-url';
import { GUIDE_PAGES, getGuideBySlug } from '@/lib/seo-content';
import {
  Breadcrumbs,
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
  return GUIDE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getGuideBySlug(slug);
  if (!page) return {};
  return withSiteMetadata(`/guides/${page.slug}`, {
    title: page.metaTitle,
    description: page.metaDescription,
    openGraph: { title: page.h1, description: page.metaDescription, type: 'article' },
  });
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const page = getGuideBySlug(slug);
  if (!page) notFound();

  const pageUrl = absoluteUrl(`/guides/${page.slug}`) ?? '';
  const breadcrumbItems = [
    { label: 'דף הבית', url: absoluteUrl('/landing') ?? '/landing' },
    { label: 'מדריכים', url: absoluteUrl('/guides') ?? '/guides' },
    { label: page.h1, url: pageUrl },
  ];

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.h1,
    description: page.metaDescription,
    datePublished: page.datePublished,
    dateModified: page.datePublished,
    author: { '@type': 'Organization', name: 'בונה הצעות מחיר' },
    publisher: { '@type': 'Organization', name: 'בונה הצעות מחיר' },
    ...(pageUrl ? { mainEntityOfPage: pageUrl } : {}),
  };

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <JsonLd data={articleJsonLd} />
      <JsonLd data={buildFaqJsonLd(page.faq)} />

      <main className="min-h-screen bg-[#F8FAFC]" dir="rtl">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Breadcrumbs
            items={[
              { label: 'דף הבית', href: '/landing' },
              { label: 'מדריכים', href: '/guides' },
              { label: page.h1 },
            ]}
          />

          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] leading-tight mb-8">
            {page.h1}
          </h1>

          {page.sections.map((section) => (
            <section key={section.heading} className="mb-8">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-3">{section.heading}</h2>
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-slate-600 leading-relaxed mb-3">
                  {p}
                </p>
              ))}
              {section.list && (
                <ul className="mt-3 space-y-2">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-slate-700">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#2563eb] shrink-0" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <SeoCta
            {...(page.slug === 'price-quote-template' || page.slug === 'price-quote-word'
              ? {
                  title:
                    page.slug === 'price-quote-word'
                      ? 'רוצה הצעת מחיר וורד מוכנה?'
                      : 'רוצה טופס הצעת מחיר מוכן?',
                  subtitle:
                    'הורד תבנית Word/Excel חינם, או בנה הצעה חכמה עם מחירון מובנה – הרשמה חינמית לייצוא PDF.',
                  secondaryHref: '/templates',
                  secondaryCta: 'הורד תבנית Word / Excel',
                }
              : {})}
          />

          <div className="my-12">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">שאלות נפוצות</h2>
            <SeoFaqList items={page.faq} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-700 font-medium mb-4">מדריכים ומחירונים נוספים</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link
                href="/guides"
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                כל המדריכים
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                מחירונים לפי ענף
              </Link>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}

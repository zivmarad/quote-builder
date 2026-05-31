import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { withSiteMetadata } from '@/lib/site-metadata';
import { absoluteUrl } from '@/lib/site-url';
import { GUIDE_PAGES } from '@/lib/seo-content';
import { Breadcrumbs, JsonLd, buildBreadcrumbJsonLd } from '../_seo/SeoComponents';

export const metadata: Metadata = withSiteMetadata('/מדריכים', {
  title: 'מדריכים להצעות מחיר לבעלי מקצוע | בונה הצעות מחיר',
  description:
    'מדריכים מעשיים לכתיבת הצעת מחיר מקצועית: הצעת מחיר לשיפוץ, טופס הצעת מחיר ואיך לתמחר נכון. כולל כלי חינמי לבניית הצעות.',
});

export default function GuidesHubPage() {
  const breadcrumbItems = [
    { label: 'דף הבית', url: absoluteUrl('/landing') ?? '/landing' },
    { label: 'מדריכים', url: absoluteUrl('/מדריכים') ?? '/מדריכים' },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <main className="min-h-screen bg-[#F8FAFC]" dir="rtl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Breadcrumbs items={[{ label: 'דף הבית', href: '/landing' }, { label: 'מדריכים' }]} />

          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] leading-tight mb-3">
            מדריכים להצעות מחיר
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-10">
            כל מה שצריך לדעת כדי לכתוב הצעת מחיר מקצועית שסוגרת עסקאות – ודרך מהירה לבנות אותה
            ב-60 שניות.
          </p>

          <div className="space-y-4">
            {GUIDE_PAGES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/מדריכים/${guide.slug}`}
                className="group block rounded-2xl border border-slate-200 bg-white p-6 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <h2 className="text-xl font-bold text-[#0F172A] mb-2 group-hover:text-[#2563eb] transition-colors">
                  {guide.h1}
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">{guide.excerpt}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563eb]">
                  קרא את המדריך
                  <ArrowLeft size={16} aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site-url';
import { INDUSTRY_PAGES, GUIDE_PAGES, PRICE_LIST_PAGES, SEO_LAST_UPDATED } from '@/lib/seo-content';

type Freq = MetadataRoute.Sitemap[number]['changeFrequency'];

type SitemapEntry = { path: string; changeFrequency: Freq; priority: number; lastModified?: Date };

/** תאריך עדכון התוכן ה-SEO – יציב בין builds (לא משתנה בכל דיפלוי). */
const SEO_MODIFIED = new Date(SEO_LAST_UPDATED);

const PUBLIC_PATHS: SitemapEntry[] = [
  { path: '/landing', changeFrequency: 'weekly', priority: 1 },
  { path: '/', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/guides', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/templates', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/login', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/signup', changeFrequency: 'monthly', priority: 0.6 },
];

const SEO_PATHS: SitemapEntry[] = [
  ...PRICE_LIST_PAGES.map((p) => ({
    // עמודי "מחירון" – נפח החיפוש הגבוה ביותר, לכן עדיפות 0.9
    path: `/pricing/${p.slug}`,
    changeFrequency: 'monthly' as Freq,
    priority: 0.9,
    lastModified: SEO_MODIFIED,
  })),
  ...INDUSTRY_PAGES.map((p) => ({
    path: `/price-quote/${p.slug}`,
    changeFrequency: 'monthly' as Freq,
    priority: 0.8,
    lastModified: SEO_MODIFIED,
  })),
  ...GUIDE_PAGES.map((p) => ({
    path: `/guides/${p.slug}`,
    changeFrequency: 'monthly' as Freq,
    priority: 0.7,
    lastModified: new Date(p.dateModified ?? SEO_LAST_UPDATED),
  })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const buildDate = new Date();

  return [...PUBLIC_PATHS, ...SEO_PATHS].flatMap(({ path, changeFrequency, priority, lastModified }) => {
    const url = absoluteUrl(path);
    if (!url) return [];
    return [{ url, lastModified: lastModified ?? buildDate, changeFrequency, priority }];
  });
}

import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site-url';
import { INDUSTRY_PAGES, GUIDE_PAGES, PRICE_LIST_PAGES } from '@/lib/seo-content';

type Freq = MetadataRoute.Sitemap[number]['changeFrequency'];

const PUBLIC_PATHS: Array<{ path: string; changeFrequency: Freq; priority: number }> = [
  { path: '/landing', changeFrequency: 'weekly', priority: 1 },
  { path: '/', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/מדריכים', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/מחירון', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/login', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/signup', changeFrequency: 'monthly', priority: 0.6 },
];

const SEO_PATHS: Array<{ path: string; changeFrequency: Freq; priority: number }> = [
  ...INDUSTRY_PAGES.map((p) => ({
    path: `/הצעת-מחיר/${p.slug}`,
    changeFrequency: 'monthly' as Freq,
    priority: 0.8,
  })),
  ...PRICE_LIST_PAGES.map((p) => ({
    path: `/מחירון/${p.slug}`,
    changeFrequency: 'monthly' as Freq,
    priority: 0.7,
  })),
  ...GUIDE_PAGES.map((p) => ({
    path: `/מדריכים/${p.slug}`,
    changeFrequency: 'monthly' as Freq,
    priority: 0.7,
  })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [...PUBLIC_PATHS, ...SEO_PATHS].flatMap(({ path, changeFrequency, priority }) => {
    const url = absoluteUrl(path);
    if (!url) return [];
    return [{ url, lastModified, changeFrequency, priority }];
  });
}

import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site-url';

const PUBLIC_PATHS: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '/landing', changeFrequency: 'weekly', priority: 1 },
  { path: '/', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/login', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/signup', changeFrequency: 'monthly', priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PATHS.flatMap(({ path, changeFrequency, priority }) => {
    const url = absoluteUrl(path);
    if (!url) return [];
    return [{ url, lastModified, changeFrequency, priority }];
  });
}

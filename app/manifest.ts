import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site-url';

export default function manifest(): MetadataRoute.Manifest {
  const siteRoot = absoluteUrl('/');

  return {
    id: siteRoot ?? '/',
    name: 'בונה הצעות מחיר',
    short_name: 'הצעות מחיר',
    description: 'בנה הצעות מחיר מקצועיות בעברית – PDF, וואטסאפ והיסטוריה.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#2563eb',
    dir: 'rtl',
    lang: 'he',
    icons: [
      { src: '/icon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'בונה הצעות מחיר',
    short_name: 'הצעות מחיר',
    description: 'בנה הצעות מחיר מקצועיות בעברית – PDF, וואטסאפ והיסטוריה.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#2563eb',
    dir: 'rtl',
    lang: 'he',
    icons: [
      { src: '/icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}

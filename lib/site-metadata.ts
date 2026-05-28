import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl } from './site-url';

export const SITE_NAME = 'הצעות מחיר';

/** metadataBase, canonical, Open Graph ו-Twitter לדף נתון. */
export function withSiteMetadata(path: string, metadata: Metadata): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = absoluteUrl(path) ?? path;

  return {
    ...metadata,
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    alternates: {
      canonical,
      ...metadata.alternates,
    },
    openGraph: {
      siteName: SITE_NAME,
      locale: 'he_IL',
      type: 'website',
      url: canonical,
      ...metadata.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      ...metadata.twitter,
    },
  };
}

import { createOgImage, createTitledOgImage, OG_ALT, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og-image';
import { INDUSTRY_PAGES, getIndustryBySlug } from '@/lib/seo-content';

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return INDUSTRY_PAGES.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getIndustryBySlug(slug);
  if (!page) return createOgImage();
  return createTitledOgImage(page.h1);
}

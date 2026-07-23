import { createOgImage, createTitledOgImage, OG_ALT, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og-image';
import { GUIDE_PAGES, getGuideBySlug } from '@/lib/seo-content';

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return GUIDE_PAGES.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getGuideBySlug(slug);
  if (!page) return createOgImage();
  return createTitledOgImage(page.h1, 'מדריך · hatzaot.co.il');
}

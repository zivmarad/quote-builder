import { LANDING_FAQ_ITEMS } from './landing-faq-data';
import { absoluteUrl } from '../../../lib/site-url';

export default function LandingJsonLd() {
  const landingUrl = absoluteUrl('/landing');
  const ogImage = absoluteUrl('/landing/og-image.png');

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'מחולל הצעות מחיר',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'ILS',
    },
    description:
      'מחולל הצעות מחיר לקבלנים ושיפוצניקים בישראל – יצירת PDF ממותג, תמחור דינמי ושליחה בוואטסאפ.',
    ...(landingUrl ? { url: landingUrl } : {}),
    ...(ogImage ? { image: ogImage } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }} />
    </>
  );
}

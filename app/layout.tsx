import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';
import { withSiteMetadata } from '@/lib/site-metadata';
import { AuthProvider } from './contexts/AuthContext';
import LanguageWrapper from './components/LanguageWrapper';
import AppChrome from './components/AppChrome';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '700', '900'],
});

export const metadata: Metadata = withSiteMetadata('/', {
  title: 'בונה הצעות מחיר | תמחור והצעות מחיר מקצועיות',
  description:
    'בונה הצעות מחיר לקבלנים ושיפוצניקים – PDF ממותג, שליחה בוואטסאפ והיסטוריה. מתאים לבעלי מקצוע בישראל.',
  openGraph: {
    title: 'בונה הצעות מחיר | hatzaot.co.il',
    description:
      'בונה הצעות מחיר לקבלנים ושיפוצניקים – PDF ממותג, שליחה בוואטסאפ והיסטוריה.',
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.className} antialiased bg-[#F8FAFC]`}>
        <AuthProvider>
          <LanguageWrapper>
            <AppChrome>{children}</AppChrome>
          </LanguageWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

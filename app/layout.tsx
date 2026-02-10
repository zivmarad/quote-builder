import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};
import { AuthProvider } from './contexts/AuthContext';
import QuoteBasketWithAuth from './components/QuoteBasketWithAuth';
import UserDataProviders from './components/UserDataProviders';
import FloatingCartButton from './components/FloatingCartButton';
import StorageQuotaAlert from './components/StorageQuotaAlert';
import AppHeader from './components/AppHeader';
import Footer from './components/Footer';
import RegisterServiceWorker from './components/RegisterServiceWorker';
import InAppBrowserBanner from './components/InAppBrowserBanner';
import LanguageWrapper from './components/LanguageWrapper';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '700', '900'],
});

export const metadata: Metadata = {
  title: 'בונה הצעות מחיר | תמחור והצעות מחיר מקצועיות',
  description: 'בנה הצעות מחיר בעברית במהירות – שירותים, תוספות, PDF branded, שליחה בוואטסאפ והיסטוריה. מתאים לבעלי מקצוע וקבלנים.',
  openGraph: {
    title: 'בונה הצעות מחיר',
    description: 'בנה הצעות מחיר מקצועיות בעברית – PDF, וואטסאפ והיסטוריה.',
    locale: 'he_IL',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.className} antialiased bg-[#F8FAFC]`}>
<AuthProvider>
        <LanguageWrapper>
          <UserDataProviders>
            <QuoteBasketWithAuth>
              <AppHeader />
              <InAppBrowserBanner />
              <div className="min-h-screen flex flex-col">
                {children}
                <Footer />
              </div>
              <FloatingCartButton />
              <StorageQuotaAlert />
              <RegisterServiceWorker />
            </QuoteBasketWithAuth>
            </UserDataProviders>
          </LanguageWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
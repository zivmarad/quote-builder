'use client';

import { usePathname } from 'next/navigation';
import QuoteBasketWithAuth from './QuoteBasketWithAuth';
import UserDataProviders from './UserDataProviders';
import FloatingCartButton from './FloatingCartButton';
import StorageQuotaAlert from './StorageQuotaAlert';
import SyncFailureBanner from './SyncFailureBanner';
import AppHeader from './AppHeader';
import Footer from './Footer';
import RegisterServiceWorker from './RegisterServiceWorker';
import InAppBrowserBanner from './InAppBrowserBanner';
import InstallAppPrompt from './InstallAppPrompt';
import SeoHeader from '../(marketing)/landing/SeoHeader';
import MarketingFooter from '../(marketing)/landing/MarketingFooter';

function isMarketingLanding(pathname: string): boolean {
  return pathname === '/landing' || pathname.startsWith('/landing/');
}

/** דפי תוכן SEO – גולשים מגוגל, בלי עגלת קניות / התקנת אפליקציה. */
function isMarketingSeoPage(pathname: string): boolean {
  return (
    pathname.startsWith('/guides') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/price-quote') ||
    pathname.startsWith('/templates')
  );
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  if (isMarketingLanding(pathname)) {
    return <>{children}</>;
  }

  if (isMarketingSeoPage(pathname)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <SeoHeader />
        {children}
        <MarketingFooter />
      </div>
    );
  }

  return (
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
        <SyncFailureBanner />
        <RegisterServiceWorker />
        <InstallAppPrompt />
      </QuoteBasketWithAuth>
    </UserDataProviders>
  );
}

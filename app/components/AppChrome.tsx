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

function isMarketingLanding(pathname: string): boolean {
  return pathname === '/landing' || pathname.startsWith('/landing/');
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  if (isMarketingLanding(pathname)) {
    return <>{children}</>;
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
      </QuoteBasketWithAuth>
    </UserDataProviders>
  );
}

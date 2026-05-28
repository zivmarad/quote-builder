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
import { FirstVisitOnboardingProvider } from '../contexts/FirstVisitOnboardingContext';
import FirstVisitProgressBar from './onboarding/FirstVisitProgressBar';
import FirstVisitCelebrationToast from './onboarding/FirstVisitCelebrationToast';

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
      <FirstVisitOnboardingProvider>
        <QuoteBasketWithAuth>
          <AppHeader />
          <FirstVisitProgressBar />
          <FirstVisitCelebrationToast />
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
      </FirstVisitOnboardingProvider>
    </UserDataProviders>
  );
}

import LandingHeader from './LandingHeader';
import MarketingFooter from './MarketingFooter';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] overflow-x-clip">
      <LandingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}

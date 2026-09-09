'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
// import NavbarAd from './NavbarAd'; // Ads temporarily disabled
import BackToTop from './BackToTop';
import PageTransition from './PageTransition';
import BottomTabBar from './BottomTabBar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudioRoute = pathname.startsWith('/studio');
  const isAuthRoute = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  const hideGlobalChrome = isStudioRoute || isAuthRoute;

  return (
    <>
      {!hideGlobalChrome && (
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[100] rounded bg-white px-4 py-2 font-semibold text-black focus:not-sr-only"
        >
          Skip to main content
        </a>
      )}
      {!hideGlobalChrome && <Navbar />}
  {/* {!hideGlobalChrome && <NavbarAd />}  Ads disabled temporarily */}
      <PageTransition>
        <div id="main-content" tabIndex={-1}>{children}</div>
      </PageTransition>
      {!hideGlobalChrome && <BottomTabBar />}
      {!hideGlobalChrome && <Footer />}
      {!hideGlobalChrome && <BackToTop />}
    </>
  );
}

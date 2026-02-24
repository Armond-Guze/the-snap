'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
// import NavbarAd from './NavbarAd'; // Ads temporarily disabled
import BackToTop from './BackToTop';
import PageTransition from './PageTransition';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudioRoute = pathname.startsWith('/studio');
  const isAuthRoute = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  const hideGlobalChrome = isStudioRoute || isAuthRoute;

  return (
    <>
      {!hideGlobalChrome && <Navbar />}
  {/* {!hideGlobalChrome && <NavbarAd />}  Ads disabled temporarily */}
      <PageTransition>
        <main>{children}</main>
      </PageTransition>
      {!hideGlobalChrome && <Footer />}
      {!hideGlobalChrome && <BackToTop />}
    </>
  );
}

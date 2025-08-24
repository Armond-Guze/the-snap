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
  const isArticlePage = pathname.includes('/headlines/') && pathname.split('/').length > 2;
  const isHomePage = pathname === '/';

  return (
    <>
      {!isStudioRoute && <Navbar />}
  {/* {!isStudioRoute && !isArticlePage && !isHomePage && <NavbarAd />}  Ads disabled temporarily */}
      <PageTransition>
        <main>{children}</main>
      </PageTransition>
      {!isStudioRoute && <Footer />}
      {!isStudioRoute && <BackToTop />}
    </>
  );
}

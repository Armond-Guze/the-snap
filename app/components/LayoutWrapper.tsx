'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import NavbarAd from './NavbarAd';
import BackToTop from './BackToTop';
import PageTransition from './PageTransition';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudioRoute = pathname.startsWith('/studio');

  return (
    <>
      {!isStudioRoute && <Navbar />}
      {!isStudioRoute && <NavbarAd />}
      <PageTransition>
        <main>{children}</main>
      </PageTransition>
      {!isStudioRoute && <Footer />}
      {!isStudioRoute && <BackToTop />}
    </>
  );
}

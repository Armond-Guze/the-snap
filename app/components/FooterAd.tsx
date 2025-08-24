"use client";
import { useEffect } from 'react';

// Extend the Window interface to include adsbygoogle
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { adsbygoogle: any[] }
}

const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
const FOOTER_SLOT = process.env.NEXT_PUBLIC_ADSENSE_FOOTER_SLOT_ID || process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

export default function FooterAd() {
  useEffect(() => {
    try {
      console.log('AdSense: Initializing footer ad...');
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      console.log('AdSense: Footer ad pushed to queue');
    } catch (e) {
      console.error('AdSense footer ad error:', e);
    }
  }, []);

  // Hide ads in development
  const consentGranted = typeof window !== 'undefined' && localStorage.getItem('cookie_consent') === '1';
  if (process.env.NODE_ENV === 'development' || !ADS_ENABLED || !ADSENSE_CLIENT || !consentGranted) {
    return null;
  }

  return (
    <div className="w-full flex justify-center bg-background py-4">
      <div className="w-full max-w-4xl">
        <div className="text-xs text-gray-500 mb-1 text-center">Advertisement</div>
        <ins
          className="adsbygoogle block w-full h-[90px]"
          data-ad-client={ADSENSE_CLIENT}
          {...(FOOTER_SLOT ? { 'data-ad-slot': FOOTER_SLOT } : {})}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}

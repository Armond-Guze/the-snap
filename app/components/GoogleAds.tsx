"use client";
import { useEffect, useRef } from 'react';

// Extend the Window interface to include adsbygoogle
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { adsbygoogle: any[] }
}

const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID; // e.g. ca-pub-xxxx
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID; // optional display slot

export default function GoogleAds() {
  const initializedRef = useRef(false);
  const consentGranted = typeof window !== 'undefined' && localStorage.getItem('cookie_consent') === '1';

  useEffect(() => {
    if (!ADS_ENABLED || !ADSENSE_CLIENT || !consentGranted) return;
    if (initializedRef.current) return; // avoid duplicate push on fast refresh / remount
    try {
      console.log('AdSense: queueing ad (homepage block)');
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initializedRef.current = true;
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [consentGranted]);

  if (!ADS_ENABLED || !ADSENSE_CLIENT || !consentGranted) return null;

  return (
    <div className="w-full flex justify-center bg-background py-4">
      <div className="w-full max-w-4xl">
        <div className="text-xs text-gray-500 mb-1 text-center">Advertisement</div>
        {/* Reserve approximate height to reduce CLS; actual ad responsive */}
        <div className="min-h-[90px]">
          <ins
            className="adsbygoogle block w-full"
            data-ad-client={ADSENSE_CLIENT}
            {...(ADSENSE_SLOT ? { 'data-ad-slot': ADSENSE_SLOT } : {})}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  );
}

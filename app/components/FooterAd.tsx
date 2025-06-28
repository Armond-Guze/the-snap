'use client';
import { useEffect } from 'react';

// Extend the Window interface to include adsbygoogle
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

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
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  return (
    <div className="w-full flex justify-center bg-background py-4">
      <div className="w-full max-w-4xl">
        <div className="text-xs text-gray-500 mb-1 text-center">Advertisement</div>
        <ins
          className="adsbygoogle block w-full h-[90px] border border-gray-200 bg-gray-50"
          data-ad-client="ca-pub-7706858365277925"
          data-ad-slot="6943307518"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}

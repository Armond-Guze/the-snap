'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

// Add your IP addresses, localhost, and dev domains here
const EXCLUDED_ENVIRONMENTS = [
  'localhost',
  '127.0.0.1',
  '192.168.',
  '10.',
  'dev.',
  'staging.',
  // Add your home/office IP addresses here
  // 'YOUR_HOME_IP_ADDRESS',
  // 'YOUR_OFFICE_IP_ADDRESS'
];

const isDevelopment = process.env.NODE_ENV === 'development';
const isExcludedEnvironment = () => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPrivateIP = EXCLUDED_ENVIRONMENTS.some(ip => hostname.includes(ip));
  
  return isDevelopment || isLocalhost || isPrivateIP;
};

export default function GoogleAnalytics({ GA_MEASUREMENT_ID }: { GA_MEASUREMENT_ID: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Don't track in development or excluded environments
    if (isExcludedEnvironment()) {
      console.log('Analytics tracking disabled - development/excluded environment');
      return;
    }

    const url = pathname + searchParams.toString();
    
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      // Additional privacy settings
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });
  }, [pathname, searchParams, GA_MEASUREMENT_ID]);

  // Don't load GA script in development
  if (isExcludedEnvironment()) {
    return null;
  }

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true
            });
          `,
        }}
      />
    </>
  );
}

// Enhanced tracking function with filtering
export const trackEvent = (eventName: string, parameters?: Record<string, string | number | boolean>) => {
  // Don't track events in development or excluded environments
  if (isExcludedEnvironment()) {
    console.log('Event tracking disabled:', eventName, parameters);
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

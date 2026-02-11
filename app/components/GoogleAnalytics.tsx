"use client";
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

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
  const cookieExcluded = document.cookie.split(';').some(c => c.trim().startsWith('va-exclude=1'));
  const lsExcluded = window.localStorage.getItem('va-exclude') === '1';
  
  return isDevelopment || isLocalhost || isPrivateIP || cookieExcluded || lsExcluded;
};

export default function GoogleAnalytics({ GA_MEASUREMENT_ID }: { GA_MEASUREMENT_ID: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialConfigSent = useRef(false);
  const [ready, setReady] = useState(false);

  // Mark GA ready once the inline init script has run and gtag function exists
  useEffect(() => {
    if (isExcludedEnvironment()) return;
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      setReady(true);
    }
  }, []);

  // Track route changes once GA is ready
  useEffect(() => {
    if (isExcludedEnvironment()) return;
    if (!ready || typeof window.gtag !== 'function') return;

    const query = searchParams.toString();
    const page_path = query ? `${pathname}?${query}` : pathname;

    if (!initialConfigSent.current) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path,
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });
      initialConfigSent.current = true;
      if (process.env.NODE_ENV !== 'production') console.log('[GA] initial config', page_path);
    } else {
      window.gtag('event', 'page_view', { page_path });
      if (process.env.NODE_ENV !== 'production') console.log('[GA] route change page_view', page_path);
    }
  }, [pathname, searchParams, GA_MEASUREMENT_ID, ready]);

  if (isExcludedEnvironment()) return null;

  return (
    <>
      <Script
        id="ga-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          if (process.env.NODE_ENV !== 'production') console.log('[GA] gtag.js loaded');
        }}
      />
      <Script
        id="ga-inline-init"
        strategy="afterInteractive"
      >{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);} // define stub
        gtag('js', new Date());
        // Do not call config here with page_path; let effect handle it to avoid double page_view
      `}</Script>
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

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, parameters);
  }
};

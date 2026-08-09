"use client";
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __theSnapGaInitialized?: boolean;
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

const hasCookieValue = (name: string, value: string) => {
  try {
    return document.cookie
      .split(';')
      .some(cookie => cookie.trim() === `${name}=${value}`);
  } catch {
    return false;
  }
};

const hasLocalStorageValue = (name: string, value: string) => {
  try {
    return window.localStorage.getItem(name) === value;
  } catch {
    return false;
  }
};

const hasAnalyticsConsent = () => {
  if (typeof window === 'undefined') return false;

  return (
    hasCookieValue('cookie_consent', '1') ||
    hasLocalStorageValue('cookie_consent', '1')
  );
};

const isExcludedEnvironment = () => {
  if (typeof window === 'undefined') return true;
  
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPrivateIP = EXCLUDED_ENVIRONMENTS.some(ip => hostname.includes(ip));
  const cookieExcluded = hasCookieValue('va-exclude', '1');
  const lsExcluded = hasLocalStorageValue('va-exclude', '1');
  
  return isDevelopment || isLocalhost || isPrivateIP || cookieExcluded || lsExcluded;
};

const initializeGtagQueue = () => {
  if (
    typeof window === 'undefined' ||
    isExcludedEnvironment() ||
    !hasAnalyticsConsent()
  ) {
    return false;
  }

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // Match Google's loader contract, which queues the Arguments object.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  }

  if (!window.__theSnapGaInitialized) {
    window.gtag('js', new Date());
    window.__theSnapGaInitialized = true;
  }

  return true;
};

export default function GoogleAnalytics({ GA_MEASUREMENT_ID }: { GA_MEASUREMENT_ID: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialConfigSent = useRef(false);
  const lastTrackedPage = useRef<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Build the queue only after consent. The external script is rendered on the
  // following pass, so route events can be queued without racing Next's Script.
  useEffect(() => {
    setInitialized(initializeGtagQueue());
  }, []);

  // Disable gtag's automatic page view and send one explicit event for both the
  // initial page and subsequent App Router navigations.
  useEffect(() => {
    if (
      !initialized ||
      isExcludedEnvironment() ||
      !hasAnalyticsConsent() ||
      typeof window.gtag !== 'function'
    ) {
      return;
    }

    const query = searchParams.toString();
    const page_path = query ? `${pathname}?${query}` : pathname;

    if (!initialConfigSent.current) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false,
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });
      initialConfigSent.current = true;
      if (process.env.NODE_ENV !== 'production') console.log('[GA] configured');
    }

    if (lastTrackedPage.current === page_path) return;

    window.gtag('event', 'page_view', {
      page_path,
      page_location: window.location.href,
      page_title: document.title
    });
    lastTrackedPage.current = page_path;

    if (process.env.NODE_ENV !== 'production') console.log('[GA] page_view', page_path);
  }, [pathname, searchParams, GA_MEASUREMENT_ID, initialized]);

  if (!initialized) return null;

  return (
    <Script
      id="ga-src"
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      strategy="afterInteractive"
      onLoad={() => {
        if (process.env.NODE_ENV !== 'production') console.log('[GA] gtag.js loaded');
      }}
    />
  );
}

// Enhanced tracking function with filtering
export const trackEvent = (eventName: string, parameters?: Record<string, string | number | boolean>) => {
  // Never emit events before explicit consent, even if gtag remains in memory
  // after an analytics component unmount.
  if (isExcludedEnvironment() || !hasAnalyticsConsent()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Event tracking disabled:', eventName, parameters);
    }
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, parameters);
  }
};

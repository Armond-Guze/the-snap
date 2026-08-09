"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { disablePosthog } from "@/lib/posthog-browser";

// Dynamically import analytics so bundle excluded when user opted out
const VercelAnalytics = dynamic(() => import("@vercel/analytics/react").then(m => m.Analytics), { ssr: false, loading: () => null });
const GoogleAnalytics = dynamic(() => import("./GoogleAnalytics"), { ssr: false, loading: () => null });
const PostHogBootstrap = dynamic(() => import("./PostHogBootstrap"), { ssr: false, loading: () => null });

// Only load GA when explicitly configured.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

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
    return localStorage.getItem(name) === value;
  } catch {
    return false;
  }
};

const setLocalStorageValue = (name: string, value?: string) => {
  try {
    if (value === undefined) {
      localStorage.removeItem(name);
    } else {
      localStorage.setItem(name, value);
    }
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
};

const setCookieValue = (name: string, value?: string) => {
  try {
    document.cookie = value === undefined
      ? `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`
      : `${name}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {
    // Cookies can be unavailable in restricted browsing contexts.
  }
};

const isAnalyticsExcluded = () => (
  hasCookieValue('va-exclude', '1') ||
  hasLocalStorageValue('va-exclude', '1')
);

const hasAnalyticsConsent = () => (
  hasCookieValue('cookie_consent', '1') ||
  hasLocalStorageValue('cookie_consent', '1')
);

/**
 * Conditionally load Vercel Analytics only if the visitor has NOT opted out.
 * Opt-out methods:
 *  - localStorage key: va-exclude = '1'
 *  - ?exclude_analytics=1 (sets the key for future visits)
 *  - ?include_analytics=1 (removes the key)
 * Includes a small toggle button in non-production environments.
 */
export default function AnalyticsGate() {
  const pathname = usePathname();
  const hideOnRoute =
    pathname.startsWith("/studio") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");
  const [excluded, setExcluded] = useState<boolean | null>(null);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  const readConsent = useCallback(() => {
    setHasConsent(hasAnalyticsConsent());
  }, []);

  const toggle = useCallback(() => {
    if (excluded) {
      setLocalStorageValue("va-exclude");
      setCookieValue("va-exclude");
    } else {
      setLocalStorageValue("va-exclude", "1");
      setCookieValue("va-exclude", "1");
    }
    setExcluded(isAnalyticsExcluded());
  }, [excluded]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      let shouldCleanUrl = false;
      if (params.has("exclude_analytics")) {
        setLocalStorageValue("va-exclude", "1");
        setCookieValue("va-exclude", "1");
        shouldCleanUrl = true;
      } else if (params.has("include_analytics")) {
        setLocalStorageValue("va-exclude");
        setCookieValue("va-exclude");
        shouldCleanUrl = true;
      }

      if (shouldCleanUrl) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("exclude_analytics");
        cleanUrl.searchParams.delete("include_analytics");
        const nextUrl = `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`;
        window.history.replaceState({}, "", nextUrl || "/");
      }

      setExcluded(isAnalyticsExcluded());
    } catch {
      setExcluded(false);
    }
    readConsent();

    const onStorage = (event: StorageEvent) => {
      if (event.key === "va-exclude") {
        setExcluded(isAnalyticsExcluded());
      }
      if (event.key === "cookie_consent") {
        readConsent();
      }
    };

    const onConsentUpdated = () => readConsent();
    window.addEventListener("storage", onStorage);
    window.addEventListener("cookie-consent-updated", onConsentUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cookie-consent-updated", onConsentUpdated as EventListener);
    };
  }, [readConsent]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  useEffect(() => {
    if (excluded === null || hasConsent === null) return;
    if (hideOnRoute || excluded || !hasConsent) {
      void disablePosthog();
    }
  }, [excluded, hasConsent, hideOnRoute]);

  if (hideOnRoute) return null;
  if (excluded === null || hasConsent === null) return null;

  const analyticsEnabled = !hideOnRoute && !excluded && hasConsent;

  return (
    <>
      {analyticsEnabled && (
        <>
          <PostHogBootstrap />
          <VercelAnalytics />
          {GA_MEASUREMENT_ID && <GoogleAnalytics GA_MEASUREMENT_ID={GA_MEASUREMENT_ID} />}
        </>
      )}
      {process.env.NODE_ENV !== "production" && (
        <div className="fixed z-50 bottom-3 right-3 flex flex-col items-end space-y-2">
          <button
            type="button"
            onClick={toggle}
            className="rounded-md bg-gray-800/80 hover:bg-gray-700 text-[11px] px-2.5 py-1.5 font-medium tracking-wide backdrop-blur border border-white/10"
            title="Toggle analytics (Alt+Shift+A)"
          >
            {excluded ? "Analytics OFF" : "Analytics ON"}
          </button>
          <div className="hidden md:block text-[10px] text-gray-400 select-none pr-0.5">Alt+Shift+A</div>
        </div>
      )}
    </>
  );
}

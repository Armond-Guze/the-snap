"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Dynamically import analytics so bundle excluded when user opted out
const VercelAnalytics = dynamic(() => import("@vercel/analytics/react").then(m => m.Analytics), { ssr: false, loading: () => null });
const GoogleAnalytics = dynamic(() => import("./GoogleAnalytics"), { ssr: false, loading: () => null });

// Only load GA when explicitly configured.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

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
    try {
      const cookieConsent = document.cookie.split(';').some(c => c.trim().startsWith('cookie_consent=1'));
      const lsConsent = localStorage.getItem("cookie_consent") === "1";
      setHasConsent(cookieConsent || lsConsent);
    } catch {
      setHasConsent(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (excluded) {
      localStorage.removeItem("va-exclude");
      // Clear cookie by expiring it
      document.cookie = 'va-exclude=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      setExcluded(false);
    } else {
      localStorage.setItem("va-exclude", "1");
      // Set a 1 year cookie
      document.cookie = 'va-exclude=1; Path=/; Max-Age=' + 60 * 60 * 24 * 365 + '; SameSite=Lax';
      setExcluded(true);
    }
  }, [excluded]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      let shouldCleanUrl = false;
      if (params.has("exclude_analytics")) {
        localStorage.setItem("va-exclude", "1");
        document.cookie = 'va-exclude=1; Path=/; Max-Age=' + 60 * 60 * 24 * 365 + '; SameSite=Lax';
        shouldCleanUrl = true;
      } else if (params.has("include_analytics")) {
        localStorage.removeItem("va-exclude");
        document.cookie = 'va-exclude=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        shouldCleanUrl = true;
      }

      if (shouldCleanUrl) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("exclude_analytics");
        cleanUrl.searchParams.delete("include_analytics");
        const nextUrl = `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`;
        window.history.replaceState({}, "", nextUrl || "/");
      }

      const cookieExcluded = document.cookie.split(';').some(c => c.trim().startsWith('va-exclude=1'));
      const lsExcluded = localStorage.getItem("va-exclude") === "1";
      setExcluded(cookieExcluded || lsExcluded);
    } catch {
      setExcluded(false);
    }
    readConsent();

    const onStorage = (event: StorageEvent) => {
      if (event.key === "va-exclude") {
        try {
          const cookieExcluded = document.cookie.split(';').some(c => c.trim().startsWith('va-exclude=1'));
          const lsExcluded = localStorage.getItem("va-exclude") === "1";
          setExcluded(cookieExcluded || lsExcluded);
        } catch {
          setExcluded(false);
        }
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

  if (hideOnRoute) return null;
  if (excluded === null || hasConsent === null) return null;

  const analyticsEnabled = !excluded && hasConsent;

  return (
    <>
      {analyticsEnabled && (
        <>
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

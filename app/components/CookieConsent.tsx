"use client";
import { useEffect, useState } from 'react';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { adsbygoogle: any[] }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      // Hide banner inside Sanity Studio (/studio/*) since it's only for editors.
      if (window.location.pathname.startsWith('/studio')) return;

      const stored = window.localStorage.getItem('cookie_consent');
      if (!stored) setVisible(true);
    } catch {/* ignore */}
  }, []);

  const accept = () => {
    try {
      window.localStorage.setItem('cookie_consent', '1');
      document.cookie = 'cookie_consent=1; Path=/; Max-Age=' + 60 * 60 * 24 * 365 + '; SameSite=Lax';
      window.dispatchEvent(new Event('cookie-consent-updated'));
    } catch {/* ignore */}
    setVisible(false);
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      try { window.adsbygoogle.push({}); } catch {/* ignore */}
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-3xl px-5 py-4 rounded-2xl border border-white/10 bg-gradient-to-r from-[#05060a]/95 via-[#0b1020]/70 to-[#05060a]/95 shadow-2xl backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-center md:text-left md:items-start">
          <p className="text-sm font-semibold text-white">Cookies & analytics</p>
          <p className="text-sm text-gray-200 leading-relaxed">
            We use cookies for performance, analytics, and optional ads. Continue to accept or see our{' '}
            <a
              href="/privacy-policy"
              className="underline italic font-semibold whitespace-nowrap bg-gradient-to-r from-sky-300 to-cyan-200 bg-clip-text text-transparent hover:from-sky-200 hover:to-cyan-100"
            >
              Privacy Policy
            </a>.
          </p>
        </div>
        <div className="flex items-center gap-3 md:flex-shrink-0 w-full md:w-auto justify-center md:justify-end">
          <button
            onClick={accept}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold shadow hover:bg-gray-200 transition cursor-pointer w-full md:w-auto text-center"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

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
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('cookie_consent') : null;
      if (!stored) setVisible(true);
    } catch {/* ignore */}
  }, []);

  const accept = () => {
    try {
      window.localStorage.setItem('cookie_consent', '1');
      document.cookie = 'cookie_consent=1; Path=/; Max-Age=' + 60 * 60 * 24 * 365 + '; SameSite=Lax';
    } catch {/* ignore */}
    setVisible(false);
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      try { window.adsbygoogle.push({}); } catch {/* ignore */}
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] bg-gray-900/95 border border-gray-700 rounded-xl p-4 backdrop-blur shadow-lg">
      <p className="text-sm text-gray-200 mb-3">
        We use cookies to analyze traffic, improve content, and (if enabled) serve ads. By clicking Accept you consent. See our {' '}
  <a href="/privacy-policy" className="underline hover:text-white">Privacy Policy</a>.
      </p>
      <div className="flex justify-end">
        <button onClick={accept} className="px-4 py-1.5 rounded-md bg-white text-black font-medium hover:bg-gray-200 transition">Accept</button>
      </div>
    </div>
  );
}
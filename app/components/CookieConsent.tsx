"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import Link from 'next/link';
import {
  CONSENT_OPEN_EVENT,
  useConsentPreferences,
  writeConsentPreferences,
} from './consent';

const subscribeToNativePlatform = () => () => {};

export default function CookieConsent() {
  const pathname = usePathname();
  const hideOnRoute =
    pathname.startsWith('/studio') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const consent = useConsentPreferences();
  const isNativePlatform = useSyncExternalStore(
    subscribeToNativePlatform,
    () => Capacitor.isNativePlatform(),
    () => false
  );
  const visible = !hideOnRoute && !isNativePlatform && (preferencesOpen || consent === null);

  useEffect(() => {
    const open = () => {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPreferencesOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  useEffect(() => {
    if (!visible) return;
    acceptButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        writeConsentPreferences({ analytics: false, advertising: false, externalMedia: false });
        setPreferencesOpen(false);
        previousFocusRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  const choose = (choices: { analytics: boolean; advertising: boolean; externalMedia: boolean }) => {
    writeConsentPreferences(choices);
    setPreferencesOpen(false);
    previousFocusRef.current?.focus();
  };

  if (hideOnRoute || !visible) return null;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-3xl px-5 py-4 rounded-2xl border border-white/10 bg-gradient-to-r from-[#05060a]/95 via-[#0b1020]/70 to-[#05060a]/95 shadow-2xl backdrop-blur"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-center md:text-left md:items-start">
          <h2 id="cookie-consent-title" className="text-sm font-semibold text-white">Optional cookies</h2>
          <p id="cookie-consent-description" className="text-sm text-gray-200 leading-relaxed">
            Essential storage keeps the site working. Choose whether to allow analytics, third-party media, and advertising services.{' '}
            <Link
              href="/privacy-policy"
              className="underline italic font-semibold whitespace-nowrap bg-gradient-to-r from-sky-300 to-cyan-200 bg-clip-text text-transparent hover:from-sky-200 hover:to-cyan-100"
            >
              Privacy Policy
            </Link>.
          </p>
        </div>
        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center md:flex-shrink-0 w-full md:w-auto justify-center md:justify-end">
          <button
            type="button"
            onClick={() => choose({ analytics: false, advertising: false, externalMedia: false })}
            className="px-4 py-2 rounded-lg border border-white/20 bg-transparent text-white text-sm font-semibold hover:bg-white/10 transition cursor-pointer w-full md:w-auto text-center"
          >
            Reject optional
          </button>
          <button
            type="button"
            onClick={() => choose({ analytics: true, advertising: false, externalMedia: false })}
            className="px-4 py-2 rounded-lg border border-white/20 bg-transparent text-white text-sm font-semibold hover:bg-white/10 transition cursor-pointer w-full md:w-auto text-center"
          >
            Analytics only
          </button>
          <button
            ref={acceptButtonRef}
            type="button"
            onClick={() => choose({ analytics: true, advertising: true, externalMedia: true })}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold shadow hover:bg-gray-200 transition cursor-pointer w-full md:w-auto text-center"
          >
            Accept all
          </button>
        </div>
      </div>
    </section>
  );
}

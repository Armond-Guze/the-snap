"use client";

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useConsentPreferences } from './consent';

interface Props {
  slug: string;
  className?: string;
}

const VIEW_DEDUPE_WINDOW_MS = 12 * 60 * 60 * 1000;

const isExcludedEnvironment = () => {
  if (typeof window === 'undefined') return true;

  const hostname = window.location.hostname;
  const isDev = process.env.NODE_ENV === 'development';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPrivateIP = hostname.startsWith('192.168.') || hostname.startsWith('10.');
  const cookieExcluded = document.cookie
    .split(';')
    .some((cookie) => cookie.trim().startsWith('va-exclude=1'));
  let localStorageExcluded = false;
  try {
    localStorageExcluded = window.localStorage.getItem('va-exclude') === '1';
  } catch {
    // Storage can be unavailable in privacy-focused browsing contexts.
  }

  return isDev || isLocalhost || isPrivateIP || cookieExcluded || localStorageExcluded;
};

function hasRecentView(slug: string) {
  if (typeof window === 'undefined') return false;

  try {
    const raw = window.localStorage.getItem(`view-hit:${slug}`);
    const previous = raw ? Number(raw) : 0;
    return Number.isFinite(previous) && previous > 0 && Date.now() - previous < VIEW_DEDUPE_WINDOW_MS;
  } catch {
    return false;
  }
}

function markView(slug: string) {
  try {
    window.localStorage.setItem(`view-hit:${slug}`, String(Date.now()));
  } catch {
    // Server-side HMAC deduplication remains authoritative.
  }
}

export default function ArticleViewCount({ slug, className }: Props) {
  const [count, setCount] = useState<number | null>(null);
  const preferences = useConsentPreferences();
  const analyticsAllowed = preferences?.analytics === true;

  useEffect(() => {
    if (!slug || !analyticsAllowed) return;
    let cancelled = false;
    const encodedSlug = encodeURIComponent(slug);

    const loadCount = async () => {
      try {
        const response = await fetch(`/api/views/${encodedSlug}`, {
          credentials: 'same-origin',
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && typeof data.count === 'number') setCount(data.count);
      } catch {
        // The count is non-essential UI.
      }
    };

    const increment = async () => {
      if (isExcludedEnvironment() || hasRecentView(slug)) return;
      try {
        const response = await fetch(`/api/views/${encodedSlug}`, {
          method: 'POST',
          keepalive: true,
          credentials: 'same-origin',
        });
        if (!response.ok) return;
        markView(slug);
        const data = await response.json();
        if (!cancelled && typeof data.count === 'number') setCount(data.count);
      } catch {
        // The count is non-essential UI.
      }
    };

    void loadCount();
    void increment();

    return () => {
      cancelled = true;
    };
  }, [analyticsAllowed, slug]);

  if (!analyticsAllowed) return null;

  const text = count === null
    ? '— views'
    : `${count.toLocaleString()} view${count === 1 ? '' : 's'}`;

  return <span className={clsx('text-xs text-white/60', className)}>{text}</span>;
}

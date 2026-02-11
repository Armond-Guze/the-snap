"use client";
import { useEffect, useState } from 'react';
import clsx from 'clsx';

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
  const isPrivateIP = hostname.includes('192.168.') || hostname.includes('10.');
  const cookieExcluded = document.cookie.split(';').some(c => c.trim().startsWith('va-exclude=1'));
  const lsExcluded = window.localStorage.getItem('va-exclude') === '1';

  return isDev || isLocalhost || isPrivateIP || cookieExcluded || lsExcluded;
};

function shouldIncrementView(slug: string) {
  if (typeof window === 'undefined') return false;

  try {
    const key = `view-hit:${slug}`;
    const now = Date.now();
    const raw = window.localStorage.getItem(key);
    const previous = raw ? Number(raw) : 0;
    if (Number.isFinite(previous) && previous > 0 && now - previous < VIEW_DEDUPE_WINDOW_MS) {
      return false;
    }
    window.localStorage.setItem(key, String(now));
    return true;
  } catch {
    return true;
  }
}

export default function ArticleViewCount({ slug, className }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const encodedSlug = encodeURIComponent(slug);

    const loadCount = async () => {
      try {
        const res = await fetch(`/api/views/${encodedSlug}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.count === 'number') {
          setCount(data.count);
        }
      } catch {
        // ignore
      }
    };

    const increment = async () => {
      if (isExcludedEnvironment() || !shouldIncrementView(slug)) return;
      try {
        const res = await fetch(`/api/views/${encodedSlug}`, { method: 'POST', keepalive: true });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.count === 'number') {
          setCount(data.count);
        }
      } catch {
        // ignore
      }
    };

    loadCount();
    increment();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const text = count === null ? '— views' : `${count.toLocaleString()} view${count === 1 ? '' : 's'}`;

  return <span className={clsx('text-xs text-white/60', className)}>{text}</span>;
}

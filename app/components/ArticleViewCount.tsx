"use client";
import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface Props {
  slug: string;
  className?: string;
}

export default function ArticleViewCount({ slug, className }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const hit = async () => {
      try {
        const res = await fetch(`/api/views/${encodeURIComponent(slug)}`, { method: 'POST' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.count === 'number') {
          setCount(data.count);
        }
      } catch {
        // ignore
      }
    };
    hit();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const text = count === null ? '— views' : `${count.toLocaleString()} view${count === 1 ? '' : 's'}`;

  return <span className={clsx('text-xs text-white/60', className)}>{text}</span>;
}

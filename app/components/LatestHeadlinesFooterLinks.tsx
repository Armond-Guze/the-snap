"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Item { _id: string; title: string; slug: { current: string } }

export default function LatestHeadlinesFooterLinks({ limit = 6 }: { limit?: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/latest-headlines?limit=${limit}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setItems(json.items || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [limit]);

  if (loading) {
    return (
      <div>
        <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Latest Headlines</h4>
        <ul className="grid grid-cols-1 gap-2 animate-pulse">
          {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
            <li key={i} className="h-3 bg-white/10 rounded" />
          ))}
        </ul>
      </div>
    );
  }
  if (!items.length) return null;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Latest Headlines</h4>
  <Link href="/headlines" className="text-[11px] text-gray-400 hover:text-white">View all</Link>
      </div>
      <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        {items.slice(0, limit).map(i => (
          <li key={i._id} className="min-w-0">
            <a href={`/headlines/${i.slug.current}`} className="text-gray-400 hover:text-white transition-colors line-clamp-1">
              {i.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

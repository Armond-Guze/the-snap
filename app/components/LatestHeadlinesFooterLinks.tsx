"use client";
import { useEffect, useState } from 'react';

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
        <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Latest Headlines</h4>
        <ul className="space-y-2 animate-pulse">
          {Array.from({ length: limit }).map((_, i) => (
            <li key={i} className="h-3 bg-white/10 rounded" />
          ))}
        </ul>
      </div>
    );
  }
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Latest Headlines</h4>
      <ul className="space-y-2">
        {items.map(i => (
          <li key={i._id}><a href={`/headlines/${i.slug.current}`} className="text-gray-400 hover:text-white transition-colors text-sm">{i.title}</a></li>
        ))}
      </ul>
    </div>
  );
}

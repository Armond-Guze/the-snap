'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Loader2, Search, X } from 'lucide-react';
import './search.css';

interface SearchResult {
  _id: string; _type: string; title: string; homepageTitle?: string; slug: string;
  image?: string; category?: string; format?: string; seasonYear?: number;
  weekNumber?: number; playoffRound?: string; rankingType?: string;
}

function resultHref(result: SearchResult) {
  if (result.format === 'powerRankings') {
    const round = result.playoffRound?.toLowerCase() || (typeof result.weekNumber === 'number' ? `week-${result.weekNumber}` : null);
    return result.rankingType === 'snapshot' && result.seasonYear && round
      ? `/articles/power-rankings/${result.seasonYear}/${round}` : '/articles/power-rankings';
  }
  return `${result._type === 'fantasyFootball' ? '/fantasy' : '/articles'}/${encodeURIComponent(result.slug)}`;
}

export default function SmartSearch({ className = '', variant = 'header' }: {
  className?: string; variant?: 'header' | 'modal' | 'inline';
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<{ query: string; results: SearchResult[]; error?: string } | null>(null);
  const term = query.trim();
  const loading = term.length >= 2 && response?.query !== term;

  useEffect(() => {
    if (!open || term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search is temporarily unavailable.');
        if (!controller.signal.aborted) setResponse({ query: term, results: data.results });
      } catch (error) {
        if (!controller.signal.aborted) setResponse({ query: term, results: [], error: error instanceof Error ? error.message : 'Search is temporarily unavailable.' });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, term]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) { setQuery(''); setResponse(null); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger className={`snap-search-trigger ${variant === 'header' ? '' : 'snap-search-trigger-wide'} ${className}`} aria-label="Open search">
        <Search size={19} strokeWidth={1.6} /><span>Search The Snap</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="snap-search-backdrop" />
        <Dialog.Content className="snap-search-panel" aria-describedby="snap-search-description">
          <Dialog.Title className="sr-only">Search The Snap</Dialog.Title>
          <Dialog.Description id="snap-search-description" className="sr-only">Search NFL news, rankings, and fantasy coverage. Enter at least two characters.</Dialog.Description>
          <div className="snap-search-input-row">
            <Search size={22} strokeWidth={1.6} aria-hidden="true" />
            <label htmlFor="snap-search-input" className="sr-only">Search articles</label>
            <input id="snap-search-input" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search teams, players, and stories" maxLength={120} autoComplete="off" aria-controls="snap-search-results" />
            <Dialog.Close aria-label="Close search"><X size={21} strokeWidth={1.6} /></Dialog.Close>
          </div>
          <div className="snap-search-body" id="snap-search-results" aria-busy={loading}>
            {term.length < 2 ? <>
              <p className="snap-search-kicker">Explore The Snap</p>
              <div className="snap-search-suggestions">{['NFL Draft', 'Power Rankings', 'Fantasy', 'Chiefs', 'Quarterbacks'].map(label => <button key={label} onClick={() => setQuery(label)}>{label}<ArrowUpRight size={17} /></button>)}</div>
              <p className="snap-search-hint">Search headlines, analysis, rankings, and fantasy coverage.</p>
            </> : loading ? <p className="snap-search-status" role="status"><Loader2 size={20} className="animate-spin" />Searching…</p>
              : response?.error ? <p className="snap-search-status" role="alert">{response.error}</p>
              : response?.results.length ? <>
                <p className="snap-search-kicker" role="status">{response.results.length} results</p>
                <ul className="snap-search-results">{response.results.map(result => <li key={result._id}><Dialog.Close asChild><Link href={resultHref(result)}>
                  {result.image ? <Image src={result.image} alt="" width={96} height={72} /> : <span className="snap-search-placeholder"><Search size={22} /></span>}
                  <span><small>{result.category || result.format || 'The Snap'}</small><strong>{result.homepageTitle || result.title}</strong></span><ArrowUpRight size={18} aria-hidden="true" />
                </Link></Dialog.Close></li>)}</ul>
              </> : <p className="snap-search-status" role="status">No stories found for “{term}”. Try a team, player, or topic.</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

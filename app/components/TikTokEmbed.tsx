'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { parseTikTokVideoUrl } from '@/lib/embed-urls';
import BlockedEmbed from './BlockedEmbed';
import { useConsentPreferences } from './consent';

interface TikTokEmbedProps {
  url: string;
  className?: string;
  title?: string;
}

export default function TikTokEmbed({ url, className = '', title }: TikTokEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const preferences = useConsentPreferences();
  const canLoadExternalMedia = preferences?.externalMedia === true;
  const video = useMemo(() => parseTikTokVideoUrl(url), [url]);

  useEffect(() => {
    if (!canLoadExternalMedia || !video || !ref.current) return;
    let cancelled = false;

    function handleLoad() {
      if (timer) clearTimeout(timer);
      if (!cancelled) setLoaded(true);
    }

    const timer = setTimeout(() => {
      if (!cancelled) setError(true);
    }, 10_000);

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.tiktok.com/embed.js"]'
    );
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://www.tiktok.com/embed.js';
      s.async = true;
      s.onload = handleLoad;
      s.onerror = () => {
        if (!cancelled) setError(true);
      };
      document.body.appendChild(s);
    } else {
      // TikTok does not expose a stable process API. Re-executing its fixed,
      // allowlisted script lets it discover blockquotes added after first load.
      const s = document.createElement('script');
      s.src = 'https://www.tiktok.com/embed.js';
      s.async = true;
      s.onload = handleLoad;
      s.onerror = () => {
        if (!cancelled) setError(true);
      };
      document.body.appendChild(s);
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canLoadExternalMedia, video]);

  if (!video) {
    return <BlockedEmbed service="TikTok" href={null} className={className} invalid />;
  }

  if (!canLoadExternalMedia) {
    return <BlockedEmbed service="TikTok" href={video.url} className={className} />;
  }

  if (error) {
    return (
      <div className={`p-4 border border-gray-800 rounded-lg bg-gray-900 text-center ${className}`}>
        <p className="text-sm text-gray-300">TikTok video unavailable.</p>
        <a href={video.url} className="text-blue-400 text-xs underline" target="_blank" rel="noopener noreferrer">Open on TikTok</a>
      </div>
    );
  }

  return (
    <div className={`tiktok-embed-wrapper ${className}`}>
      {title && <h4 className="text-sm font-medium text-gray-300 mb-2">{title}</h4>}
      {!loaded && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          <span className="ml-2 text-xs text-gray-400">Loading TikTok...</span>
        </div>
      )}
      <div ref={ref}>
        <blockquote
          className="tiktok-embed mx-auto min-w-[280px] max-w-[605px]"
          cite={video.url}
          data-video-id={video.videoId}
        >
          <section>
            <a href={video.url} target="_blank" rel="noopener noreferrer">
              View video on TikTok
            </a>
          </section>
        </blockquote>
      </div>
    </div>
  );
}

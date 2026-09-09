'use client';

import { useEffect, useRef, useState } from 'react';
import { normalizeInstagramPostUrl } from '@/lib/embed-urls';
import BlockedEmbed from './BlockedEmbed';
import { useConsentPreferences } from './consent';

interface InstagramWindow extends Window {
  instgrm?: {
    Embeds?: { process: () => void }
  }
}

interface InstagramEmbedProps {
  url: string;
  className?: string;
  title?: string;
}

export default function InstagramEmbed({ url, className = '', title }: InstagramEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const preferences = useConsentPreferences();
  const canLoadExternalMedia = preferences?.externalMedia === true;
  const normalized = normalizeInstagramPostUrl(url);

  useEffect(() => {
    if (!canLoadExternalMedia || !normalized || !ref.current) return;
    let cancelled = false;
    let pendingScript: HTMLScriptElement | null = null;

    function process() {
      const w = window as InstagramWindow;
      if (w.instgrm?.Embeds) {
        try {
          w.instgrm.Embeds.process();
          if (timeoutId) clearTimeout(timeoutId);
          if (!cancelled) setLoaded(true);
        } catch {
          if (!cancelled) setError(true);
        }
      }
    }

    const timeoutId = setTimeout(() => {
      if (!cancelled) setError(true);
    }, 10_000);

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.instagram.com/embed.js"]'
    );
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://www.instagram.com/embed.js';
      s.async = true;
      s.onload = process;
      s.onerror = () => {
        if (!cancelled) setError(true);
      };
      document.body.appendChild(s);
      pendingScript = s;
    } else if ((window as InstagramWindow).instgrm?.Embeds) {
      process();
    } else {
      existing.addEventListener('load', process, { once: true });
      pendingScript = existing;
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      pendingScript?.removeEventListener('load', process);
    };
  }, [canLoadExternalMedia, normalized]);

  if (!normalized) {
    return <BlockedEmbed service="Instagram" href={null} className={className} invalid />;
  }

  if (!canLoadExternalMedia) {
    return <BlockedEmbed service="Instagram" href={normalized} className={className} />;
  }

  if (error) {
    return (
      <div className={`p-4 border border-gray-800 rounded-lg bg-gray-900 text-center ${className}`}>
        <p className="text-sm text-gray-300">Instagram post unavailable.</p>
        <a href={normalized} className="text-blue-400 text-xs underline" target="_blank" rel="noopener noreferrer">Open on Instagram</a>
      </div>
    );
  }

  return (
    <div className={`instagram-embed-wrapper ${className}`}>
      {title && <h4 className="text-sm font-medium text-gray-300 mb-2">{title}</h4>}
      {!loaded && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          <span className="ml-2 text-xs text-gray-400">Loading Instagram...</span>
        </div>
      )}
      <div ref={ref}>
        <blockquote
          className="instagram-media mx-auto w-full max-w-[540px] bg-black"
          data-instgrm-permalink={normalized}
          data-instgrm-version="14"
        >
          <a href={normalized} target="_blank" rel="noopener noreferrer">
            View post on Instagram
          </a>
        </blockquote>
      </div>
    </div>
  );
}

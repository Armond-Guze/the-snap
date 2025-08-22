'use client';

import { useEffect, useRef, useState } from 'react';

interface TikTokEmbedProps {
  url: string;
  className?: string;
  title?: string;
}

export default function TikTokEmbed({ url, className = '', title }: TikTokEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = `<blockquote class="tiktok-embed" cite="${url}" data-video-id="" style="max-width:605px;min-width:325px; margin:0 auto;">
      <section>Loading...</section>
    </blockquote>`;

    function handleLoad() {
      setLoaded(true);
    }

    if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.tiktok.com/embed.js';
      s.async = true;
      s.onload = handleLoad;
      s.onerror = () => setError(true);
      document.body.appendChild(s);
    } else {
      // Force reprocess by cloning existing script (TikTok auto processes new blockquotes added before script load)
      setTimeout(() => setLoaded(true), 1200);
    }
  }, [url]);

  if (error) {
    return (
      <div className={`p-4 border border-gray-800 rounded-lg bg-gray-900 text-center ${className}`}>
        <p className="text-sm text-gray-300">TikTok video unavailable.</p>
        <a href={url} className="text-blue-400 text-xs underline" target="_blank" rel="noopener noreferrer">Open on TikTok</a>
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
      <div ref={ref} />
    </div>
  );
}

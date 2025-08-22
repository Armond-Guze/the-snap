'use client';

import { useEffect, useRef, useState } from 'react';

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

  // Normalize URL (ensure trailing slash for Instagram embed script)
  const normalized = url.endsWith('/') ? url : url + '/';

  useEffect(() => {
    if (!ref.current) return;
    // Insert blockquote
    ref.current.innerHTML = `
      <blockquote class="instagram-media" data-instgrm-permalink="${normalized}" data-instgrm-version="14" style="margin:0 auto; width:100%; max-width:540px; background:#000;">
        <a href="${normalized}" target="_blank" rel="noopener noreferrer">View post</a>
      </blockquote>`;

    function process() {
      const w = window as InstagramWindow;
      if (w.instgrm?.Embeds) {
        try {
          w.instgrm.Embeds.process();
          setLoaded(true);
        } catch {
          setError(true);
        }
      }
    }

    if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.instagram.com/embed.js';
      s.async = true;
      s.onload = process;
      s.onerror = () => setError(true);
      document.body.appendChild(s);
    } else {
      process();
    }
  }, [normalized]);

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
      <div ref={ref} />
    </div>
  );
}

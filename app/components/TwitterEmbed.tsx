'use client';

import { useState, useEffect, useRef } from 'react';
import { ExternalLink, MessageCircle } from 'lucide-react';
import styles from './TwitterEmbed.module.css';

interface TwitterEmbedProps {
  twitterUrl: string;
  className?: string;
}

export default function TwitterEmbed({ 
  twitterUrl, 
  className = ""
}: TwitterEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanUrl = (url: string): string => {
    try {
      const cleanedUrl = url.replace(/x\.com/g, 'twitter.com');
      const urlObj = new URL(cleanedUrl);
      const cleanPath = urlObj.pathname;

      return `https://twitter.com${cleanPath}`;
    } catch (error) {
      console.error('Error cleaning URL:', error);
      return url;
    }
  };

  const getTweetId = (url: string): string | null => {
    try {
      const patterns = [
        /\/status\/(\d+)/,
        /\/statuses\/(\d+)/,
        /twitter\.com\/\w+\/status\/(\d+)/,
        /x\.com\/\w+\/status\/(\d+)/,
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting tweet ID:', error);
      return null;
    }
  };

  const tweetId = getTweetId(twitterUrl);
  const cleanedUrl = cleanUrl(twitterUrl);

  useEffect(() => {
    let cancelled = false;

    const loadTwitterScript = async () => {
      if (window.twttr?.widgets?.createTweet) return;

      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]') as HTMLScriptElement | null;
        if (existing) {
          if (window.twttr?.widgets?.createTweet) {
            resolve();
            return;
          }
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('Twitter widgets script failed to load')), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Twitter widgets script failed to load'));
        document.head.appendChild(script);
      });
    };

    const renderTweet = async () => {
      if (!tweetId || !containerRef.current) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        await loadTwitterScript();
        if (cancelled || !containerRef.current || !window.twttr?.widgets?.createTweet) return;

        containerRef.current.innerHTML = '';
        await window.twttr.widgets.createTweet(tweetId, containerRef.current, {
          theme: 'dark',
          dnt: true,
          cards: 'visible',
          conversation: 'all',
          align: 'center',
        });

        if (!cancelled) setIsLoading(false);
      } catch (error) {
        console.error('Error rendering tweet embed:', error);
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    renderTweet();

    return () => {
      cancelled = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [tweetId]);

  if (hasError || !tweetId) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Tweet Unavailable</h3>
          <p className="text-gray-400 text-sm mb-4">
            Sorry, this tweet could not be loaded.
          </p>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-100 text-black border border-gray-300 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Twitter/X
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-visible bg-transparent border-0 ${className}`}>
      <div className="relative">
        {isLoading && (
          <div className="flex items-center justify-center p-8 min-h-[320px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
            <span className="ml-2 text-gray-400">Loading tweet...</span>
          </div>
        )}

        {!hasError && (
          <div className={styles.twitterEmbedWrapper}>
            <div 
              ref={containerRef}
              className={styles.twitterEmbedContainer}
            />
          </div>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          tweetId: string,
          element: HTMLElement,
          options?: {
            theme?: 'light' | 'dark';
            dnt?: boolean;
            cards?: 'hidden' | 'visible';
            conversation?: 'none' | 'all';
            align?: 'left' | 'center' | 'right';
          }
        ) => Promise<HTMLElement>;
      };
    };
  }
}

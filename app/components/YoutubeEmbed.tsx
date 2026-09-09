'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, ExternalLink, Maximize2 } from 'lucide-react';
import Image from 'next/image';
import { youtubeEmbedUrl, youtubeThumbnailUrl, youtubeWatchUrl } from '@/lib/youtube';
import BlockedEmbed from './BlockedEmbed';
import { useConsentPreferences } from './consent';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  variant?: 'default' | 'article'; // deprecated, kept for compatibility
}

export default function YouTubeEmbed({ 
  videoId, 
  title = "Related Video",
  className = "",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variant
}: YouTubeEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const preferences = useConsentPreferences();
  const canLoadExternalMedia = preferences?.externalMedia === true;

  const thumbnailUrl = youtubeThumbnailUrl(videoId);
  const embedUrl = youtubeEmbedUrl(videoId);
  const watchUrl = youtubeWatchUrl(videoId);
  const hasValidId = Boolean(embedUrl);

  // Add timeout to handle stuck loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && showEmbed) {
        setIsLoading(false);
        setHasError(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [isLoading, showEmbed]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handlePlayClick = () => {
    setShowEmbed(true);
    setIsLoading(true);
  };

  useEffect(() => {
    if (!isFullscreen || !canLoadExternalMedia) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflowY = document.body.style.overflowY;

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsFullscreen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute('disabled'));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeyDown);
    document.body.style.overflowY = 'hidden';
    closeButtonRef.current?.focus();
    
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      document.body.style.overflowY = previousOverflowY;
      previouslyFocused?.focus();
    };
  }, [canLoadExternalMedia, isFullscreen]);

  if (!hasValidId) {
    return <BlockedEmbed service="YouTube" href={null} className={className} invalid />;
  }

  if (!canLoadExternalMedia) {
    return <BlockedEmbed service="YouTube" href={watchUrl} className={className} />;
  }

  if (hasError) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Video Unavailable</h3>
          <p className="text-gray-400 text-sm mb-4">
            Sorry, this video could not be loaded.
          </p>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} video player`}
          tabIndex={-1}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        >
          <div className="relative w-full h-full max-w-7xl max-h-screen">
            <div className="relative w-full h-full bg-black">
              {showEmbed ? (
                <iframe
                  src={embedUrl}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  onLoad={handleLoad}
                  onError={handleError}
                />
              ) : (
                <button
                  type="button"
                  className="relative block h-full w-full cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
                  onClick={handlePlayClick}
                  aria-label={`Play ${title}`}
                >
                  <Image
                    src={thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </button>
              )}
            </div>
            
            {/* Close fullscreen button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              title="Close fullscreen"
              aria-label="Close fullscreen"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Regular video container */}
      <div className={`rounded-2xl overflow-hidden ${className}`}>
        <div className="relative aspect-video bg-black">
          {!showEmbed ? (
            // Thumbnail with play button
            <button
              type="button"
              className="relative block h-full w-full cursor-pointer group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
              onClick={handlePlayClick}
              aria-label={`Play ${title}`}
            >
              <Image
                src={thumbnailUrl}
                alt=""
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                <div className="w-15 h-15 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          ) : (
            // Embed iframe
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
              
              <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                onLoad={handleLoad}
                onError={handleError}
              />
            </>
          )}
          
          {/* Fullscreen button - bottom right */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="absolute bottom-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            title="Toggle fullscreen"
            aria-label="Toggle fullscreen"
          >
            <Maximize2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
      
      {/* Title and Link Below Video */}
      <div className="p-4 pb-2">
        {title && (
          <h3 className="text-sm text-gray-300 font-medium mb-2">{title}</h3>
        )}
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Watch on YouTube
        </a>
      </div>
    </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Play, ExternalLink, Maximize2 } from 'lucide-react';
import Image from 'next/image';
import { youtubeEmbedUrl, youtubeThumbnailUrl, youtubeWatchUrl } from '@/lib/youtube';

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

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const previousOverflowY = document.body.style.overflowY;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Lock only vertical page scroll while fullscreen overlay is active.
      document.body.style.overflowY = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflowY = previousOverflowY;
    };
  }, [isFullscreen]);

  if (hasError || !hasValidId) {
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
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
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
                <div 
                  className="relative w-full h-full cursor-pointer group"
                  onClick={handlePlayClick}
                >
                  <Image
                    src={thumbnailUrl}
                    alt={title}
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
                </div>
              )}
            </div>
            
            {/* Close fullscreen button */}
            <button
              onClick={handleFullscreen}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
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
            <div 
              className="relative w-full h-full cursor-pointer group"
              onClick={handlePlayClick}
            >
              <Image
                src={thumbnailUrl}
                alt={title}
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
            </div>
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
            onClick={handleFullscreen}
            className="absolute bottom-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center transition-colors group"
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

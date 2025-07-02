'use client';

import { useState, useEffect } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
}

export default function YouTubeEmbed({ 
  videoId, 
  title = "Related Video",
  className = "" 
}: YouTubeEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

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
    <div className={`bg-shadcn-zinc border border-gray-800 rounded-2xl overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center mb-2">
          <Play className="w-5 h-5 text-red-500 mr-3" />
          <h2 className="text-lg font-bold text-white">Video of the Week</h2>
        </div>
        {title && (
          <h3 className="text-sm text-gray-300 font-medium">{title}</h3>
        )}
      </div>
      
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
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
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
      </div>
      
      <div className="p-4">
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
  );
}

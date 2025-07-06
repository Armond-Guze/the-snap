'use client';

import { useState, useEffect, useRef } from 'react';
import { ExternalLink, MessageCircle, Maximize2 } from 'lucide-react';

interface TwitterEmbedProps {
  twitterUrl: string;
  title?: string;
  className?: string;
}

export default function TwitterEmbed({ 
  twitterUrl, 
  title = "Related Tweet",
  className = ""
}: TwitterEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [embedHtml, setEmbedHtml] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Clean URL to ensure it works with both twitter.com and x.com
  const cleanUrl = (url: string): string => {
    try {
      // Convert x.com to twitter.com for better compatibility
      const cleanedUrl = url.replace(/x\.com/g, 'twitter.com');
      
      // Remove any query parameters that might interfere
      const urlObj = new URL(cleanedUrl);
      const cleanPath = urlObj.pathname;
      
      return `https://twitter.com${cleanPath}`;
    } catch (error) {
      console.error('Error cleaning URL:', error);
      return url;
    }
  };

  // Extract tweet ID from URL
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
          console.log(`Tweet ID found:`, match[1]);
          return match[1];
        }
      }
      
      console.error('No tweet ID found in URL:', url);
      return null;
    } catch (error) {
      console.error('Error extracting tweet ID:', error);
      return null;
    }
  };

  const tweetId = getTweetId(twitterUrl);
  const cleanedUrl = cleanUrl(twitterUrl);

  useEffect(() => {
    const loadTweetEmbed = async () => {
      if (!tweetId) {
        console.error('No valid tweet ID found in URL:', twitterUrl);
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Loading tweet embed for:', cleanedUrl);
        
        // First, try to create the blockquote manually and let Twitter widgets handle it
        const blockquoteHtml = `
          <blockquote class="twitter-tweet" data-theme="dark" data-lang="en" data-dnt="true">
            <p lang="en" dir="ltr">Loading tweet...</p>
            <a href="${cleanedUrl}">View Tweet</a>
          </blockquote>
        `;
        
        setEmbedHtml(blockquoteHtml);
        setIsLoading(false);
        
        console.log('Created blockquote HTML for Twitter widgets processing');
      } catch (error) {
        console.error('Error loading tweet embed:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadTweetEmbed();
  }, [twitterUrl, tweetId, cleanedUrl]);

  // Load Twitter widgets script and process the embed
  useEffect(() => {
    if (embedHtml && containerRef.current) {
      console.log('Processing embed HTML with Twitter widgets...');
      console.log('Embed HTML:', embedHtml);
      
      // Set the innerHTML first
      containerRef.current.innerHTML = embedHtml;
      console.log('Set innerHTML to container');
      
      // Load Twitter widgets script if not already loaded
      const loadTwitterScript = () => {
        if (!window.twttr) {
          console.log('Loading Twitter widgets script...');
          const script = document.createElement('script');
          script.src = 'https://platform.twitter.com/widgets.js';
          script.async = true;
          script.onload = () => {
            console.log('Twitter widgets script loaded successfully');
            processWidgets();
          };
          script.onerror = (error) => {
            console.error('Failed to load Twitter widgets script:', error);
          };
          document.head.appendChild(script);
        } else {
          console.log('Twitter widgets already loaded');
          processWidgets();
        }
      };

      const processWidgets = () => {
        if (window.twttr?.widgets) {
          console.log('Processing widgets...');
          
          // Log current DOM state
          const blockquotes = containerRef.current?.querySelectorAll('.twitter-tweet');
          console.log('Found blockquotes:', blockquotes?.length);
          
          window.twttr.widgets.load();
          
          // Check if it worked after a delay
          setTimeout(() => {
            const iframe = containerRef.current?.querySelector('iframe[src*="twitter.com"]');
            const allIframes = containerRef.current?.querySelectorAll('iframe');
            console.log('Widget processing result:');
            console.log('- Twitter iframes found:', !!iframe);
            console.log('- All iframes found:', allIframes?.length);
            console.log('- Container HTML:', containerRef.current?.innerHTML);
            
            if (iframe) {
              console.log('SUCCESS: Tweet embed loaded with full content!');
              console.log('Iframe src:', iframe.getAttribute('src'));
              
              // Ensure proper styling for images/media
              const iframeElement = iframe as HTMLIFrameElement;
              iframeElement.style.width = '100%';
              iframeElement.style.maxWidth = '100%';
              iframeElement.style.minHeight = '200px';
              
              // Log iframe dimensions
              console.log('Iframe dimensions:', {
                width: iframeElement.offsetWidth,
                height: iframeElement.offsetHeight
              });
            } else {
              console.warn('No Twitter iframe found after widget processing');
            }
          }, 3000);
        } else {
          console.error('Twitter widgets not available');
        }
      };

      loadTwitterScript();
    } else {
      console.log('Skipping widget processing:', {
        hasEmbedHtml: !!embedHtml,
        hasContainer: !!containerRef.current
      });
    }
  }, [embedHtml]);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  if (hasError || !tweetId) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Tweet Unavailable</h3>
          <p className="text-gray-400 text-sm mb-4">
            Sorry, this tweet could not be loaded.
          </p>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Twitter/X
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl max-h-screen overflow-auto">
            <div className="bg-white rounded-lg p-4">
              <div 
                ref={containerRef}
                className="twitter-embed-container fullscreen"
              />
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
      
      {/* Regular tweet container */}
      <div className={`rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 ${className}`}>
        <div className="relative">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-400">Loading tweet...</span>
            </div>
          )}
          
          {!isLoading && !hasError && (
            <div className="p-4">
              <div 
                ref={containerRef}
                className="twitter-embed-container"
              />
            </div>
          )}
          
          {/* Fullscreen button - bottom right */}
          {!isLoading && !hasError && (
            <button
              onClick={handleFullscreen}
              className="absolute bottom-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center transition-colors group"
              title="Toggle fullscreen"
              aria-label="Toggle fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      
        {/* Title and Link Below Tweet */}
        <div className="p-4 pt-2">
          {title && (
            <h3 className="text-sm text-gray-300 font-medium mb-2">{title}</h3>
          )}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Twitter/X
          </a>
        </div>
      </div>
    </>
  );
}

// Extend the Window interface to include twttr
declare global {
  interface Window {
    twttr: {
      widgets: {
        load: () => void;
      };
      ready?: (callback: () => void) => void;
    };
  }
}

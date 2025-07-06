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
          <blockquote class="twitter-tweet" data-theme="dark" data-lang="en" data-dnt="true" data-conversation="none">
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
              
              // Apply styling to iframe and its container
              const iframeElement = iframe as HTMLIFrameElement;
              iframeElement.style.setProperty('width', '100%', 'important');
              iframeElement.style.setProperty('max-width', '100%', 'important');
              iframeElement.style.setProperty('min-height', '300px', 'important');
              iframeElement.style.setProperty('border', 'none', 'important');
              iframeElement.style.setProperty('border-radius', '8px', 'important');
              iframeElement.style.setProperty('background-color', 'transparent', 'important');
              
              // Apply additional styling to the iframe container
              const iframeContainer = iframeElement.parentElement;
              if (iframeContainer) {
                iframeContainer.style.setProperty('background-color', 'transparent', 'important');
                iframeContainer.style.setProperty('border', 'none', 'important');
                iframeContainer.style.setProperty('box-shadow', 'none', 'important');
                iframeContainer.style.setProperty('padding', '0', 'important');
                iframeContainer.style.setProperty('margin', '0', 'important');
              }
              
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
      {/* Regular tweet container */}
      <div className={`rounded-lg overflow-hidden bg-transparent border-0 ${className}`}>
        <div className="relative">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-400">Loading tweet...</span>
            </div>
          )}
          
          {!isLoading && !hasError && (
            <div className={styles.twitterEmbedWrapper}>
              <div 
                ref={containerRef}
                className={styles.twitterEmbedContainer}
              />
            </div>
          )}
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

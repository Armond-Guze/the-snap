'use client';
import { useEffect, useRef } from 'react';

interface UseViewTrackingProps {
  articleId: string;
  articleSlug: string;
  articleType?: 'headline' | 'rankings';
  articleTitle?: string;
}

export function useViewTracking({ 
  articleId, 
  articleSlug, 
  articleType = 'headline',
  articleTitle 
}: UseViewTrackingProps) {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (tracked.current) return;
    
    // Skip if no article data
    if (!articleId && !articleSlug) return;

    const trackView = async () => {
      try {
        const response = await fetch('/api/analytics/article-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articleId,
            articleSlug,
            articleType,
            articleTitle,
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (process.env.NODE_ENV === 'development') {
            console.log('View tracked:', result);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('View tracking failed:', error);
        }
        // Fail silently in production
      }
    };

    // Add a small delay to ensure the page has fully loaded
    const timer = setTimeout(() => {
      trackView();
      tracked.current = true;
    }, 1000);

    return () => clearTimeout(timer);
  }, [articleId, articleSlug, articleType, articleTitle]);
}

// Hook for getting view count (admin only)
export function useViewCount(articleId: string, articleSlug: string, articleType = 'headline') {
  const getViewCount = async () => {
    try {
      const params = new URLSearchParams({
        articleType,
        ...(articleId ? { articleId } : { articleSlug }),
      });

      const response = await fetch(`/api/analytics/article-view?${params}`);
      
      if (response.ok) {
        const result = await response.json();
        return result.article.viewCount;
      } else if (response.status === 401) {
        // Unauthorized - not admin
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch view count:', error);
    }
    return null;
  };

  return { getViewCount };
}

'use client';
import { trackEvent } from '@/app/components/GoogleAnalytics';

interface ArticleClickData {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  category?: string;
  author?: string;
  readingTime?: number;
  position?: number; // Position in list/grid
  source?: string; // Where the click came from (homepage, category, search, etc.)
}

// Check if current environment should be excluded from tracking
const isExcludedEnvironment = () => {
  if (typeof window === 'undefined') return true;
  
  const hostname = window.location.hostname;
  const isDev = process.env.NODE_ENV === 'development';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPrivateIP = hostname.includes('192.168.') || hostname.includes('10.');
  const cookieExcluded = document.cookie.split(';').some(c => c.trim().startsWith('va-exclude=1'));
  const lsExcluded = window.localStorage.getItem('va-exclude') === '1';
  
  return isDev || isLocalhost || isPrivateIP || cookieExcluded || lsExcluded;
};

export const useArticleTracking = () => {
  const trackArticleClick = (data: ArticleClickData) => {
    // Skip tracking in development/excluded environments
    if (isExcludedEnvironment()) {
      console.log('Article click tracking disabled - development environment');
      return;
    }

    // Google Analytics tracking
    trackEvent('article_click', {
      article_id: data.articleId,
      article_title: data.articleTitle,
      article_slug: data.articleSlug,
      category: data.category || 'unknown',
      author: data.author || 'unknown',
      reading_time: data.readingTime || 0,
      position: data.position || 0,
      source: data.source || 'unknown'
    });

    // Optional: Send to your own analytics endpoint (only in production)
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/article-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer,
          isOwner: false // You can set this to true for your own visits if needed
        })
      }).catch(err => console.error('Analytics tracking failed:', err));
    }
  };

  const trackArticleView = (data: Omit<ArticleClickData, 'position' | 'source'>) => {
    if (isExcludedEnvironment()) {
      console.log('Article view tracking disabled - development environment');
      return;
    }

    trackEvent('article_view', {
      article_id: data.articleId,
      article_title: data.articleTitle,
      article_slug: data.articleSlug,
      category: data.category || 'unknown',
      author: data.author || 'unknown',
      reading_time: data.readingTime || 0
    });

    // Persist to internal analytics store (non-blocking)
    fetch('/api/analytics/article-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: data.articleId,
        articleTitle: data.articleTitle,
        slug: data.articleSlug,
        category: data.category,
        author: data.author,
        readingTime: data.readingTime,
        timestamp: new Date().toISOString()
      })
    }).catch(()=>{});
  };

  const trackArticleShare = (data: Omit<ArticleClickData, 'position' | 'source'> & { platform: string }) => {
    if (isExcludedEnvironment()) {
      console.log('Article share tracking disabled - development environment');
      return;
    }

    trackEvent('article_share', {
      article_id: data.articleId,
      article_title: data.articleTitle,
      platform: data.platform,
      category: data.category || 'unknown'
    });
  };

  const trackReadingProgress = (data: Omit<ArticleClickData, 'position' | 'source'> & { progress: number }) => {
    if (isExcludedEnvironment()) {
      return; // Don't log for reading progress to avoid spam
    }

    trackEvent('reading_progress', {
      article_id: data.articleId,
      progress: data.progress,
      article_title: data.articleTitle
    });
  };

  return {
    trackArticleClick,
    trackArticleView,
    trackArticleShare,
    trackReadingProgress
  };
};

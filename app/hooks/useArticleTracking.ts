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

const INTERNAL_ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_INTERNAL_ANALYTICS_ENABLED !== 'false';
const INTERNAL_VIEW_SAMPLE_RATE = parseSampleRate(process.env.NEXT_PUBLIC_INTERNAL_ANALYTICS_VIEW_SAMPLE_RATE, 0.25);
const INTERNAL_CLICK_SAMPLE_RATE = parseSampleRate(process.env.NEXT_PUBLIC_INTERNAL_ANALYTICS_CLICK_SAMPLE_RATE, 0.2);
const CLICK_DEDUPE_WINDOW_MS = 20 * 1000;

function parseSampleRate(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed <= 0) return 0;
  if (parsed >= 1) return 1;
  return parsed;
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

function shouldSampleEvent(key: string, rate: number) {
  if (typeof window === 'undefined') return false;
  if (rate <= 0) return false;
  if (rate >= 1) return true;

  try {
    const storageKey = `ia-sample:${key}`;
    const cached = window.sessionStorage.getItem(storageKey);
    if (cached === '1') return true;
    if (cached === '0') return false;

    const keep = Math.random() < rate;
    window.sessionStorage.setItem(storageKey, keep ? '1' : '0');
    return keep;
  } catch {
    return Math.random() < rate;
  }
}

function shouldTrackViewThisSession(slug: string) {
  if (typeof window === 'undefined') return false;
  try {
    const key = `ia-viewed:${slug}`;
    if (window.sessionStorage.getItem(key) === '1') {
      return false;
    }
    window.sessionStorage.setItem(key, '1');
  } catch {
    // ignore storage failures and continue tracking once
  }
  return true;
}

function isRapidDuplicateClick(slug: string, source?: string) {
  if (typeof window === 'undefined') return false;
  try {
    const key = `ia-click:${slug}:${source || 'unknown'}`;
    const now = Date.now();
    const last = Number(window.sessionStorage.getItem(key) || '0');
    if (Number.isFinite(last) && last > 0 && now - last < CLICK_DEDUPE_WINDOW_MS) {
      return true;
    }
    window.sessionStorage.setItem(key, String(now));
  } catch {
    // ignore storage failures
  }
  return false;
}

function sendInternalAnalytics(url: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'production' || !INTERNAL_ANALYTICS_ENABLED) return;

  const body = JSON.stringify(payload);
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const sent = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    if (sent) return;
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  }).catch(err => console.error('Analytics tracking failed:', err));
}

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

    if (!shouldSampleEvent(`click:${data.articleSlug}`, INTERNAL_CLICK_SAMPLE_RATE)) return;
    if (isRapidDuplicateClick(data.articleSlug, data.source)) return;

    sendInternalAnalytics('/api/analytics/article-click', {
      ...data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      isOwner: false
    });
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

    if (!shouldTrackViewThisSession(data.articleSlug)) return;
    if (!shouldSampleEvent(`view:${data.articleSlug}`, INTERNAL_VIEW_SAMPLE_RATE)) return;

    sendInternalAnalytics('/api/analytics/article-view', {
      articleId: data.articleId,
      articleTitle: data.articleTitle,
      slug: data.articleSlug,
      category: data.category,
      author: data.author,
      readingTime: data.readingTime,
      timestamp: new Date().toISOString()
    });
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

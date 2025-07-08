'use client';
import { useEffect } from 'react';
import { useArticleTracking } from '@/app/hooks/useArticleTracking';

interface ArticleViewTrackerProps {
  slug: string;
  headlineId: string;
  title: string;
  category?: string;
  author?: string;
  readingTime?: number;
  className?: string;
}

export default function ArticleViewTracker({ 
  slug, 
  headlineId, 
  title, 
  category, 
  author, 
  readingTime,
  className 
}: ArticleViewTrackerProps) {
  const { trackArticleView, trackReadingProgress } = useArticleTracking();

  useEffect(() => {
    // Track article view on mount
    trackArticleView({
      articleId: headlineId,
      articleTitle: title,
      articleSlug: slug,
      category,
      author,
      readingTime
    });

    // Track reading progress
    const progressTracked = { 25: false, 50: false, 75: false, 100: false };
    
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / scrollHeight) * 100;

      // Track progress milestones
      const milestones = [25, 50, 75, 100];
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !progressTracked[milestone as keyof typeof progressTracked]) {
          progressTracked[milestone as keyof typeof progressTracked] = true;
          trackReadingProgress({
            articleId: headlineId,
            articleTitle: title,
            articleSlug: slug,
            category,
            author,
            readingTime,
            progress: milestone
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [slug, headlineId, title, category, author, readingTime, trackArticleView, trackReadingProgress]);

  return <div className={className} />;
}

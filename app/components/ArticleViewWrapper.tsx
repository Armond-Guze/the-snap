'use client';
import { useViewTracking } from '@/app/hooks/useViewTracking';
import ViewCountDisplay from './ViewCountDisplay';

interface ArticleViewWrapperProps {
  articleId: string;
  articleSlug: string;
  articleType?: 'headline' | 'rankings';
  articleTitle?: string;
  children?: React.ReactNode;
}

export default function ArticleViewWrapper({
  articleId,
  articleSlug,
  articleType = 'headline',
  articleTitle,
  children
}: ArticleViewWrapperProps) {
  // Track the view
  useViewTracking({
    articleId,
    articleSlug,
    articleType,
    articleTitle
  });

  return (
    <div>
      {children}
      {/* View count display for admin */}
      <ViewCountDisplay 
        articleId={articleId}
        articleSlug={articleSlug}
        articleType={articleType}
        className="mt-4"
      />
    </div>
  );
}

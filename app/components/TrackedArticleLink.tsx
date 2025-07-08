'use client';
import Link from 'next/link';
import { useArticleTracking } from '@/app/hooks/useArticleTracking';

interface TrackedArticleLinkProps {
  article: {
    _id: string;
    title: string;
    slug: { current: string };
    category?: { title: string };
    author?: { name: string };
  };
  children: React.ReactNode;
  className?: string;
  position?: number;
  source?: string;
  readingTime?: number;
}

export default function TrackedArticleLink({ 
  article, 
  children, 
  className, 
  position, 
  source,
  readingTime 
}: TrackedArticleLinkProps) {
  const { trackArticleClick } = useArticleTracking();

  const handleClick = () => {
    trackArticleClick({
      articleId: article._id,
      articleTitle: article.title,
      articleSlug: article.slug.current,
      category: article.category?.title,
      author: article.author?.name,
      position,
      source,
      readingTime
    });
  };

  return (
    <Link 
      href={`/headlines/${article.slug.current}`}
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}

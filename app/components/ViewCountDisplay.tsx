'use client';
import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

interface ViewCountDisplayProps {
  articleId: string;
  articleSlug: string;
  articleType?: 'headline' | 'rankings';
  className?: string;
}

export default function ViewCountDisplay({ 
  articleId, 
  articleSlug, 
  articleType = 'headline',
  className = '' 
}: ViewCountDisplayProps) {
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViewCount = async () => {
      try {
        const params = new URLSearchParams({
          articleType,
          ...(articleId ? { articleId } : { articleSlug }),
        });

        const response = await fetch(`/api/analytics/article-view?${params}`);
        
        if (response.ok) {
          const result = await response.json();
          setViewCount(result.article.viewCount);
          setIsAdmin(true);
        } else if (response.status === 401) {
          // Unauthorized - not admin
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Failed to fetch view count:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchViewCount();
  }, [articleId, articleSlug, articleType]);

  // Don't render anything if not admin or still loading
  if (!isAdmin || loading) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-400 ${className}`}>
      <Eye className="w-4 h-4" />
      <span>{viewCount?.toLocaleString() || 0} views</span>
      <span className="text-xs text-gray-500">(Admin only)</span>
    </div>
  );
}

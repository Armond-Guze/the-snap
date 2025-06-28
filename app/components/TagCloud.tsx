'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { client } from '@/sanity/lib/client';
import { tagsQuery, trendingTagsQuery } from '@/sanity/lib/queries';
import { Tag } from '@/types';

interface TagCloudProps {
  showTrendingOnly?: boolean;
  maxTags?: number;
  className?: string;
}

export default function TagCloud({
  showTrendingOnly = false,
  maxTags = 20,
  className = ''
}: TagCloudProps) {
  const [tags, setTags] = useState<(Tag & { articleCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTags() {
      try {
        const query = showTrendingOnly ? trendingTagsQuery : tagsQuery;
        const data = await client.fetch(query);
        setTags(data.slice(0, maxTags));
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTags();
  }, [showTrendingOnly, maxTags]);

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-6 w-16 bg-gray-800 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  const getTagSize = (articleCount: number) => {
    if (articleCount >= 10) return 'text-lg';
    if (articleCount >= 5) return 'text-base';
    return 'text-sm';
  };

  return (
    <div className={className}>
      {showTrendingOnly && (
        <h3 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
          🔥 Trending Topics
        </h3>
      )}
      
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag._id}
            href={`/headlines?tag=${encodeURIComponent(tag.title)}`}
            className={`inline-block px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors ${getTagSize(
              tag.articleCount
            )} ${tag.trending ? 'ring-1 ring-yellow-500' : ''}`}
            title={tag.description || `View articles tagged with ${tag.title}`}
          >
            #{tag.title}
            {tag.articleCount > 0 && (
              <span className="ml-1 text-xs opacity-75">
                ({tag.articleCount})
              </span>
            )}
          </Link>
        ))}
      </div>
      
      {!showTrendingOnly && tags.length >= maxTags && (
        <Link
          href="/tags"
          className="inline-block mt-3 text-sm text-gray-400 hover:text-white transition-colors"
        >
          View all tags →
        </Link>
      )}
    </div>
  );
}

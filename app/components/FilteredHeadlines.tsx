'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { client } from '@/sanity/lib/client';
import { headlinesByCategoryQuery, headlinesByTagQuery, headlineQuery } from '@/sanity/lib/queries';
import { HeadlineListItem } from '@/types';
import CategoryFilter from './CategoryFilter';
import TagCloud from './TagCloud';

interface FilteredHeadlinesProps {
  initialCategory?: string;
  initialTag?: string;
  initialSearch?: string;
  showFilters?: boolean;
  maxArticles?: number;
  className?: string;
}

export default function FilteredHeadlines({
  initialCategory,
  initialTag,
  initialSearch,
  showFilters = true,
  maxArticles = 12,
  className = ''
}: FilteredHeadlinesProps) {
  const [headlines, setHeadlines] = useState<HeadlineListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag || null);
  const [searchQuery, setSearchQuery] = useState<string | null>(initialSearch || null);

  // Helper function to get the correct URL based on content type
  const getArticleUrl = (item: HeadlineListItem) => {
    if (item._type === 'rankings') {
      return `/rankings/${item.slug.current.trim()}`;
    }
    return `/headlines/${item.slug.current.trim()}`;
  };

  useEffect(() => {
    async function fetchHeadlines() {
      setLoading(true);
      try {
        let data: HeadlineListItem[];
        
        if (searchQuery) {
          // Search query - fetch data using client.fetch
          data = await client.fetch(`
            *[(_type == "headline" || _type == "rankings") && published == true && (
              title match "*${searchQuery}*" ||
              summary match "*${searchQuery}*" ||
              category->title match "*${searchQuery}*" ||
              author->name match "*${searchQuery}*" ||
              rankingType match "*${searchQuery}*"
            )] | order(_createdAt desc, publishedAt desc) {
              _id,
              _type,
              title,
              homepageTitle,
              slug,
              summary,
              coverImage {
                asset->{ url }
              },
              date,
              publishedAt,
              rankingType,
              author->{ name },
              category->{ title, slug, color },
              tags[]->{ title }
            }
          `);
        } else if (selectedCategory) {
          data = await client.fetch(headlinesByCategoryQuery, { 
            categorySlug: selectedCategory 
          });
        } else if (selectedTag) {
          // Use the corrected tag query with tagTitle parameter
          data = await client.fetch(headlinesByTagQuery, { 
            tagTitle: selectedTag 
          });
        } else {
          data = await client.fetch(headlineQuery);
        }
        
        setHeadlines(data.slice(0, maxArticles));
      } catch (error) {
        console.error('Error fetching headlines:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHeadlines();
  }, [selectedCategory, selectedTag, searchQuery, maxArticles]);

  const handleCategoryChange = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    setSelectedTag(null); // Clear tag when category is selected
    setSearchQuery(null); // Clear search when category is selected
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setSelectedCategory(null); // Clear category when tag is selected
    setSearchQuery(null); // Clear search when tag is selected
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchQuery(null);
  };

  const formatDate = (date: string) => {
    if (!date || isNaN(new Date(date).getTime())) {
      return 'No date';
    }
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={className}>
      {showFilters && (
        <div className="mb-8 space-y-6">
          {/* Category Filter */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">Filter by Category</h3>
            <CategoryFilter
              selectedCategory={selectedCategory || undefined}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Tag Cloud */}
          <TagCloud showTrendingOnly={true} maxTags={10} />

          {/* Active Filters */}
          {(selectedCategory || selectedTag || searchQuery) && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">Active Filters</h4>
                <button
                  onClick={clearFilters}
                  className="text-sm text-white hover:text-gray-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white text-black">
                    Search: &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-600 text-white">
                    Category: {selectedCategory}
                  </span>
                )}
                {selectedTag && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-600 text-white">
                    Tag: {selectedTag}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Headlines Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-800 aspect-video rounded-lg mb-3" />
              <div className="space-y-2">
                <div className="bg-gray-800 h-4 rounded w-3/4" />
                <div className="bg-gray-800 h-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : headlines.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            No articles found
            {selectedCategory && ` in "${selectedCategory}"`}
            {selectedTag && ` tagged with "#${selectedTag}"`}
          </p>
          {(selectedCategory || selectedTag) && (
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              View All Articles
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {headlines.map((headline) => (
            <article
              key={headline._id}
              className="group rounded-lg overflow-hidden bg-[#0d0d0d] border border-[#1e1e1e] hover:bg-[#161616] hover:border-[#262626] transition-colors"
            >
              <Link href={getArticleUrl(headline)}>
                {headline.coverImage?.asset?.url && (
                  <div className="aspect-video relative overflow-hidden bg-[#111]">
                    <Image
                      src={headline.coverImage.asset.url}
                      alt={headline.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {headline.category && (
                      <span className="inline-block px-2 py-1 text-[11px] font-medium text-gray-300 bg-gray-800 rounded-md border border-gray-700/60">
                        {headline.category.title}
                      </span>
                    )}
                    {headline._type === 'rankings' && headline.rankingType && (
                      <span className="inline-block px-2 py-1 text-[11px] font-medium text-gray-300 bg-gray-800 rounded-md border border-gray-700/60">
                        {headline.rankingType.replace('-', ' ').toUpperCase()} RANKINGS
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-white text-[15px] group-hover:text-gray-300 transition-colors mb-2 line-clamp-2">
                    {headline.homepageTitle || headline.title}

                  </h3>
                  
                  {headline.summary && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {headline.summary}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {headline.author?.name && (
                      <span>By {headline.author.name}</span>
                    )}
                    {headline.date && (
                      <span>{formatDate(headline.date)}</span>
                    )}
                  </div>
                  
                  {headline.tags && headline.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {headline.tags
                        .filter((tag) => tag && tag.title) // Filter out null/undefined tags
                        .slice(0, 3)
                        .map((tag, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            handleTagClick(tag.title);
                          }}
                          className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          #{tag.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

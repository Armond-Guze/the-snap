'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { client } from '@/sanity/lib/client';
import { trendingTagsQuery, categoriesQuery } from '@/sanity/lib/queries';
import { Tag, Category } from '@/types';

export default function TrendingTopics() {
  const [trendingTags, setTrendingTags] = useState<(Tag & { articleCount: number })[]>([]);
  const [categories, setCategories] = useState<(Category & { articleCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrendingData() {
      try {
        const [tagsData, categoriesData] = await Promise.all([
          client.fetch(trendingTagsQuery),
          client.fetch(categoriesQuery)
        ]);
        
        setTrendingTags(tagsData.slice(0, 6));
        setCategories(categoriesData.filter((cat: any) => cat.articleCount > 0).slice(0, 6));
      } catch (error) {
        console.error('Error fetching trending data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrendingData();
  }, []);

  const getCategoryColorClasses = (color?: string) => {
    switch (color) {
      case 'red': return 'from-red-600 to-red-700 hover:from-red-500 hover:to-red-600';
      case 'blue': return 'from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600';
      case 'green': return 'from-green-600 to-green-700 hover:from-green-500 hover:to-green-600';
      case 'yellow': return 'from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600';
      case 'purple': return 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600';
      case 'orange': return 'from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600';
      default: return 'from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600';
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-6 lg:px-8 bg-black">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (trendingTags.length === 0 && categories.length === 0) {
    // Show static content when no data is available
    return (
      <section className="py-16 px-6 lg:px-8 bg-black">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <span className="text-2xl">🔥</span>
              Trending Topics
            </h2>
            <div className="w-20 h-1 bg-white mx-auto mb-4"></div>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Discover what&apos;s hot in the NFL right now
            </p>
          </div>

          {/* Static Popular Topics */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              🏷️ Popular Topics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link
                href="/headlines"
                className="group block p-4 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg text-white font-medium text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="text-sm mb-1">#NFL Draft</div>
                <div className="text-xs opacity-90">Hot Topic</div>
              </Link>
              
              <Link
                href="/headlines"
                className="group block p-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg text-white font-medium text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="text-sm mb-1">#Playoffs</div>
                <div className="text-xs opacity-90">Trending</div>
              </Link>
              
              <Link
                href="/headlines"
                className="group block p-4 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-lg text-white font-medium text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="text-sm mb-1">#Trade Rumors</div>
                <div className="text-xs opacity-90">Breaking</div>
              </Link>
              
              <Link
                href="/power-rankings"
                className="group block p-4 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg text-white font-medium text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="text-sm mb-1">Power Rankings</div>
                <div className="text-xs opacity-90">Weekly</div>
              </Link>
              
              <Link
                href="/headlines"
                className="group block p-4 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 rounded-lg text-white font-medium text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="text-sm mb-1">#Injury Report</div>
                <div className="text-xs opacity-90">Updates</div>
              </Link>
              
              <Link
                href="/headlines"
                className="group block p-4 bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 rounded-lg text-white font-medium text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="text-sm mb-1">#Free Agency</div>
                <div className="text-xs opacity-90">News</div>
              </Link>
            </div>
          </div>

          {/* View All Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Link
              href="/headlines"
              className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Browse All Headlines
            </Link>
            <Link
              href="/tags"
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              View All Tags
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 lg:px-8 bg-black">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <span className="text-2xl">🔥</span>
            Trending Topics
          </h2>
          <div className="w-20 h-1 bg-white mx-auto mb-4"></div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Discover what&apos;s hot in the NFL right now
          </p>
        </div>

        <div className="space-y-12">
          {/* Trending Tags */}
          {trendingTags.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                🏷️ Hot Tags
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {trendingTags.map((tag) => (
                  <Link
                    key={tag._id}
                    href={`/headlines?tag=${encodeURIComponent(tag.title)}`}
                    className="group block p-4 bg-gradient-to-br from-yellow-600 to-red-600 hover:from-yellow-500 hover:to-red-500 rounded-lg text-white font-medium text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    <div className="text-sm mb-1">#{tag.title}</div>
                    <div className="text-xs opacity-90">
                      {tag.articleCount} article{tag.articleCount !== 1 ? 's' : ''}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Popular Categories */}
          {categories.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                📂 Popular Categories
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    href={`/headlines?category=${category.slug.current}`}
                    className={`group block p-4 bg-gradient-to-br ${getCategoryColorClasses(
                      category.color
                    )} rounded-lg text-white font-medium text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}
                  >
                    <div className="text-sm mb-1">{category.title}</div>
                    <div className="text-xs opacity-90">
                      {(category as any).articleCount} article{(category as any).articleCount !== 1 ? 's' : ''}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View All Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <Link
            href="/headlines"
            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Browse All Headlines
          </Link>
          <Link
            href="/tags"
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            View All Tags
          </Link>
        </div>
      </div>
    </section>
  );
}

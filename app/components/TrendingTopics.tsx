'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HERO_SIZES } from '@/lib/image-sizes';
import { client } from '@/sanity/lib/client';
import { trendingTagsQuery, categoriesQuery } from '@/sanity/lib/queries';
import { Tag, Category } from '@/types';

interface TrendingTopicsProps {
  textureSrc?: string;
}

export default function TrendingTopics({ textureSrc }: TrendingTopicsProps) {
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
      case 'blue': return 'from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 text-black';
      case 'green': return 'from-green-600 to-green-700 hover:from-green-500 hover:to-green-600';
      case 'yellow': return 'from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600';
      case 'purple': return 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600';
      case 'orange': return 'from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600';
      default: return 'from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600';
    }
  };

  if (loading) {
    return (
      <section className="relative py-16 px-6 lg:px-8">
        {textureSrc && (
          <>
            <div className="absolute inset-0 -z-20">
              <Image
                src={textureSrc}
                alt="NFL background"
                fill
                priority
                quality={100}
                className="object-cover opacity-20 md:opacity-25"
                sizes={HERO_SIZES}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/75 to-black/95 -z-10" />
          </>
        )}
        <div className="mx-auto max-w-6xl relative z-10">
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
      <section className="relative py-16 px-6 lg:px-8">
        {textureSrc && (
          <>
            <div className="absolute inset-0 -z-20">
              <Image
                src={textureSrc}
                alt="NFL background"
                fill
                priority
                quality={100}
                className="object-cover opacity-30"
                sizes={HERO_SIZES}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black/80 -z-10" />
          </>
        )}
        <div className="mx-auto max-w-6xl relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="heading-h2 text-white mb-4 flex items-center justify-center gap-3">
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
            <h3 className="heading-h3 text-white mb-6 flex items-center gap-2">
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
                className="group block p-4 bg-gradient-to-br from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg text-black font-medium text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-gray-300"
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
    <section className="relative py-16 px-6 lg:px-8 2xl:px-12 3xl:px-16">
      {textureSrc && (
        <>
          <div className="absolute inset-0 -z-20">
            <Image
              src={textureSrc}
              alt="NFL background"
              fill
              priority
              quality={100}
              className="object-cover opacity-20 md:opacity-25"
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/75 to-black/95 -z-10" />
        </>
      )}
      <div className="mx-auto max-w-6xl 2xl:max-w-[90rem] 3xl:max-w-[100rem] relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 2xl:mb-12 3xl:mb-16">
          <h2 className="heading-h2 text-white mb-3 flex items-center justify-center gap-3">
            <span className="text-2xl 2xl:text-3xl 3xl:text-4xl">🔥</span>
            Trending Topics
          </h2>
          <div className="w-20 h-1 bg-white mx-auto mb-4"></div>
          <p className="text-lg 2xl:text-xl 3xl:text-2xl text-gray-300 max-w-2xl 2xl:max-w-3xl 3xl:max-w-4xl mx-auto">
            Discover what&apos;s hot in the NFL right now
          </p>
        </div>

        <div className="space-y-12 2xl:space-y-16 3xl:space-y-20">
          {/* Trending Tags */}
          {trendingTags.length > 0 && (
            <div>
              <h3 className="heading-h3 text-white mb-6 2xl:mb-8 3xl:mb-10 flex items-center gap-2">
                🏷️ Hot Tags
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 2xl:gap-6 3xl:gap-8">
                {trendingTags.map((tag) => (
                  <Link
                    key={tag._id}
                    href={`/headlines?tag=${encodeURIComponent(tag.title)}`}
                    className="group block p-4 2xl:p-6 3xl:p-8 bg-gradient-to-br from-yellow-600 to-red-600 hover:from-yellow-500 hover:to-red-500 rounded-lg text-white font-medium text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    <div className="text-sm 2xl:text-base 3xl:text-lg mb-1">#{tag.title}</div>
                    <div className="text-xs 2xl:text-sm 3xl:text-base opacity-90">
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
              <h3 className="heading-h3 text-white mb-6 2xl:mb-8 3xl:mb-10 flex items-center gap-2">
                📂 Popular Categories
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 2xl:gap-6 3xl:gap-8">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    href={`/headlines?category=${category.slug.current}`}
                    className={`group block p-4 2xl:p-6 3xl:p-8 bg-gradient-to-br ${getCategoryColorClasses(
                      category.color
                    )} rounded-lg text-white font-medium text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}
                  >
                    <div className="text-sm 2xl:text-base 3xl:text-lg mb-1">{category.title}</div>
                    <div className="text-xs 2xl:text-sm 3xl:text-base opacity-90">
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

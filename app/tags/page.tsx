'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { client } from '@/sanity/lib/client';
import { tagsQuery } from '@/sanity/lib/queries';
import { Tag } from '@/types';

export default function TagsPage() {
  const [tags, setTags] = useState<(Tag & { articleCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTags() {
      try {
        const data = await client.fetch(tagsQuery);
        setTags(data);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTags();
  }, []);

  const getTagSize = (articleCount: number) => {
    if (articleCount >= 20) return 'text-2xl p-4';
    if (articleCount >= 10) return 'text-xl p-3';
    if (articleCount >= 5) return 'text-lg p-3';
    return 'text-base p-2';
  };

  const groupedTags = {
    trending: tags.filter(tag => tag.trending),
    popular: tags.filter(tag => !tag.trending && tag.articleCount >= 5),
    other: tags.filter(tag => !tag.trending && tag.articleCount < 5)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-800 rounded w-1/3"></div>
            <div className="h-4 bg-gray-800 rounded w-2/3"></div>
            <div className="flex flex-wrap gap-3">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-8 w-20 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Browse by Tags
          </h1>
          <div className="w-24 h-1 bg-white mb-6"></div>
          <p className="text-xl text-gray-300 max-w-3xl leading-relaxed">
            Explore NFL content by topic. Larger tags indicate more articles available.
          </p>
        </div>

        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li className="text-gray-600">/</li>
            <li>
              <Link href="/headlines" className="text-gray-400 hover:text-white transition-colors">
                Headlines
              </Link>
            </li>
            <li className="text-gray-600">/</li>
            <li className="text-white">Tags</li>
          </ol>
        </nav>

        <div className="space-y-12">
          {/* Trending Tags */}
          {groupedTags.trending.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                🔥 Trending Tags
              </h2>
              <div className="flex flex-wrap gap-3">
                {groupedTags.trending.map((tag) => (
                  <Link
                    key={tag._id}
                    href={`/headlines?tag=${encodeURIComponent(tag.title)}`}
                    className={`inline-block rounded-lg bg-gradient-to-r from-yellow-600 to-red-600 hover:from-yellow-500 hover:to-red-500 text-white font-medium transition-all duration-300 transform hover:scale-105 ${getTagSize(
                      tag.articleCount
                    )}`}
                    title={tag.description || `View articles tagged with ${tag.title}`}
                  >
                    #{tag.title}
                    <span className="ml-2 text-sm opacity-90">
                      ({tag.articleCount})
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Popular Tags */}
          {groupedTags.popular.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Popular Tags</h2>
              <div className="flex flex-wrap gap-3">
                {groupedTags.popular.map((tag) => (
                  <Link
                    key={tag._id}
                    href={`/headlines?tag=${encodeURIComponent(tag.title)}`}
                    className={`inline-block rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium transition-colors ${getTagSize(
                      tag.articleCount
                    )}`}
                    title={tag.description || `View articles tagged with ${tag.title}`}
                  >
                    #{tag.title}
                    <span className="ml-2 text-sm opacity-75">
                      ({tag.articleCount})
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Other Tags */}
          {groupedTags.other.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">All Tags</h2>
              <div className="flex flex-wrap gap-2">
                {groupedTags.other.map((tag) => (
                  <Link
                    key={tag._id}
                    href={`/headlines?tag=${encodeURIComponent(tag.title)}`}
                    className="inline-block px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm transition-colors"
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
            </section>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Link
            href="/headlines"
            className="inline-block px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Browse All Headlines
          </Link>
        </div>
      </div>
    </div>
  );
}

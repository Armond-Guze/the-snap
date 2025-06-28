'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import { headlinesByCategoryQuery, categoriesQuery } from '@/sanity/lib/queries';
import { HeadlineListItem, Category } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import NewsletterSignup from '@/app/components/NewsletterSignup';

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.slug as string;
  const [headlines, setHeadlines] = useState<HeadlineListItem[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategoryData() {
      try {
        const [headlinesData, categoriesData] = await Promise.all([
          client.fetch(headlinesByCategoryQuery, { categorySlug }),
          client.fetch(categoriesQuery)
        ]);
        
        setHeadlines(headlinesData);
        const foundCategory = categoriesData.find((cat: Category) => cat.slug.current === categorySlug);
        setCategory(foundCategory || null);
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryData();
  }, [categorySlug]);

  const getCategoryColorClasses = (color?: string) => {
    switch (color) {
      case 'red': return 'bg-red-600 border-red-600';
      case 'blue': return 'bg-blue-600 border-blue-600';
      case 'green': return 'bg-green-600 border-green-600';
      case 'yellow': return 'bg-yellow-600 border-yellow-600';
      case 'purple': return 'bg-purple-600 border-purple-600';
      case 'orange': return 'bg-orange-600 border-orange-600';
      default: return 'bg-gray-600 border-gray-600';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-800 rounded w-1/3"></div>
            <div className="h-4 bg-gray-800 rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="bg-gray-800 aspect-video rounded"></div>
                  <div className="h-4 bg-gray-800 rounded"></div>
                  <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p className="text-gray-400 mb-6">The category you&apos;re looking for doesn&apos;t exist.</p>
          <Link 
            href="/headlines"
            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            Browse All Headlines
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <span className={`px-4 py-2 rounded-full text-white font-medium ${getCategoryColorClasses(category.color)}`}>
              {category.title}
            </span>
            <span className="text-gray-400">
              {headlines.length} article{headlines.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {category.title}
          </h1>
          
          {category.description && (
            <p className="text-xl text-gray-300 max-w-3xl leading-relaxed">
              {category.description}
            </p>
          )}
          
          <div className="w-24 h-1 bg-white mt-6"></div>
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
            <li className="text-white">{category.title}</li>
          </ol>
        </nav>

        {/* Newsletter Signup */}
        <div className="mb-12">
          <div className="bg-black rounded-lg p-8 border border-gray-800">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Stay Updated on {category.title}
              </h3>
              <p className="text-gray-400">
                Get the latest {category.title.toLowerCase()} news and analysis delivered to your inbox
              </p>
            </div>
            <NewsletterSignup variant="compact" className="max-w-md mx-auto" />
          </div>
        </div>

        {/* Articles Grid */}
        {headlines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              No articles found in this category yet.
            </p>
            <Link
              href="/headlines"
              className="mt-4 inline-block px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Browse All Headlines
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {headlines.map((headline) => (
              <article
                key={headline._id}
                className="group bg-black rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <Link href={`/headlines/${headline.slug.current}`}>
                  {headline.coverImage?.asset?.url && (
                    <div className="aspect-video relative overflow-hidden">
                      <Image
                        src={headline.coverImage.asset.url}
                        alt={headline.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h2 className="font-bold text-xl text-white group-hover:text-gray-300 transition-colors mb-3 line-clamp-2">
                      {headline.title}
                    </h2>
                    
                    {headline.summary && (
                      <p className="text-gray-400 leading-relaxed mb-4 line-clamp-3">
                        {headline.summary}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
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
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded"
                          >
                            #{tag.title}
                          </span>
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
    </div>
  );
}

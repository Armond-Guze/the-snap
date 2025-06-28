'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import FilteredHeadlines from '../components/FilteredHeadlines';
import TagCloud from '../components/TagCloud';
import NewsletterSignup from '../components/NewsletterSignup';

function HeadlinesContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            NFL Headlines
          </h1>
          <div className="w-24 h-1 bg-white mb-6"></div>
          <p className="text-xl text-gray-300 max-w-3xl leading-relaxed">
            Discover the latest NFL news, analysis, and breaking stories from around the league.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <FilteredHeadlines
              initialCategory={category || undefined}
              initialTag={tag || undefined}
              showFilters={true}
              maxArticles={24}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-gray-900 rounded-lg p-6">
              <TagCloud maxTags={15} />
            </div>
            
            <NewsletterSignup variant="sidebar" />
            
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Popular Categories</h3>
              <div className="space-y-2">
                <Link href="/headlines?category=nfl-draft" className="block text-gray-300 hover:text-white transition-colors">
                  NFL Draft
                </Link>
                <Link href="/headlines?category=trade-rumors" className="block text-gray-300 hover:text-white transition-colors">
                  Trade Rumors
                </Link>
                <Link href="/headlines?category=injury-report" className="block text-gray-300 hover:text-white transition-colors">
                  Injury Report
                </Link>
                <Link href="/headlines?category=power-rankings" className="block text-gray-300 hover:text-white transition-colors">
                  Power Rankings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeadlinesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
    }>
      <HeadlinesContent />
    </Suspense>
  );
}

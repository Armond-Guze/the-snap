'use client';

import { useState, useEffect } from 'react';
import { client } from '@/sanity/lib/client';
import { categoriesQuery } from '@/sanity/lib/queries';
import { Category } from '@/types';

interface CategoryFilterProps {
  selectedCategory?: string;
  onCategoryChange: (categorySlug: string | null) => void;
  className?: string;
}

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  className = ''
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await client.fetch(categoriesQuery);
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const getColorClasses = () => 'bg-gray-800 hover:bg-gray-700 border-gray-700';

  if (loading) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 bg-gray-800 rounded-full animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
          !selectedCategory
            ? 'bg-gray-800 text-gray-200 border-gray-700'
            : 'bg-transparent text-gray-400 border-gray-700 hover:text-gray-200 hover:bg-gray-800'
        }`}
      >
        All
      </button>

      {categories.map((category) => {
        const articleCount = (category as Category & { articleCount?: number }).articleCount;
        return (
        <button
          key={category._id}
          onClick={() => onCategoryChange(category.slug.current)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-2 ${
            selectedCategory === category.slug.current
              ? `text-gray-200 ${getColorClasses()}`
              : 'bg-transparent text-gray-400 border-gray-700 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          {category.title}
          {articleCount && articleCount > 0 && (
            <span className="text-xs bg-black bg-opacity-30 px-2 py-0.5 rounded-full">
              {articleCount}
            </span>
          )}
        </button>
      )})}
    </div>
  );
}

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

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-600 hover:bg-red-700 border-red-600';
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700 border-blue-600';
      case 'green':
        return 'bg-green-600 hover:bg-green-700 border-green-600';
      case 'yellow':
        return 'bg-yellow-600 hover:bg-yellow-700 border-yellow-600';
      case 'purple':
        return 'bg-purple-600 hover:bg-purple-700 border-purple-600';
      case 'orange':
        return 'bg-orange-600 hover:bg-orange-700 border-orange-600';
      default:
        return 'bg-gray-600 hover:bg-gray-700 border-gray-600';
    }
  };

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
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
          !selectedCategory
            ? 'bg-white text-black border-white'
            : 'bg-transparent text-white border-gray-600 hover:border-white hover:bg-white hover:text-black'
        }`}
      >
        All
      </button>

      {categories.map((category) => (
        <button
          key={category._id}
          onClick={() => onCategoryChange(category.slug.current)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border flex items-center gap-2 ${
            selectedCategory === category.slug.current
              ? `text-white ${getColorClasses(category.color)}`
              : 'bg-transparent text-white border-gray-600 hover:border-white hover:bg-white hover:text-black'
          }`}
        >
          {category.title}
          {(category as any).articleCount > 0 && (
            <span className="text-xs bg-black bg-opacity-30 px-2 py-0.5 rounded-full">
              {(category as any).articleCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

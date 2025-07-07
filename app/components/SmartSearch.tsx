'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { client } from '@/sanity/lib/client';

interface SearchResult {
  _id: string;
  title: string;
  slug: { current: string };
  summary?: string;
  coverImage?: {
    asset?: {
      url: string;
    };
  };
  category?: {
    title: string;
    slug?: { current: string };
  };
  author?: {
    name: string;
  };
  date: string;
  _type: string;
}

interface SmartSearchProps {
  className?: string;
  variant?: 'header' | 'modal' | 'inline';
}

export default function SmartSearch({ className = '', variant = 'header' }: SmartSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Close search on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search function with debouncing
  useEffect(() => {
    const searchArticles = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchQuery = `
          *[_type == "headline" && published == true && (
            title match "*${query}*" ||
            summary match "*${query}*" ||
            category->title match "*${query}*" ||
            author->name match "*${query}*"
          )] | order(_createdAt desc)[0...8] {
            _id,
            title,
            slug,
            summary,
            coverImage {
              asset->{ url }
            },
            category-> {
              title,
              slug
            },
            author-> {
              name
            },
            date,
            _type
          }
        `;

        const searchResults = await client.fetch<SearchResult[]>(searchQuery);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchArticles, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : -1
        );
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        } else if (query.trim()) {
          handleSubmitSearch();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, results, selectedIndex, query]);

  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    setSelectedIndex(-1);
    if (searchTerm && !recentSearches.includes(searchTerm)) {
      const newRecent = [searchTerm, ...recentSearches.slice(0, 4)];
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    }
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
  }, []);

  const handleSubmitSearch = useCallback(() => {
    if (query.trim()) {
      // Navigate to headlines page with search query
      router.push(`/headlines?search=${encodeURIComponent(query.trim())}`);
      handleClose();
    }
  }, [query, router, handleClose]);

  const handleResultClick = useCallback((result?: SearchResult) => {
    if (result) {
      router.push(`/headlines/${result.slug.current}`);
    }
    handleClose();
  }, [router, handleClose]);

  const openSearch = () => {
    setIsOpen(true);
  };

  if (variant === 'header') {
    return (
      <>
        {/* Search Icon Button */}
        <button
          onClick={openSearch}
          className={`p-2 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white ${className}`}
          aria-label="Open search"
          title="Search articles"
        >
          <Search className="h-5 w-5 text-gray-300 hover:text-white" />
        </button>

        {/* Search Modal Overlay */}
        {isOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center pt-16">
            <div 
              ref={searchRef}
              className="bg-black border border-gray-600 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
            >
              {/* Search Header */}
              <div className="p-4 border-b border-gray-600">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search articles..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmitSearch();
                      }
                    }}
                    className="w-full px-4 py-3 pl-12 pr-12 bg-gray-900 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:border-white focus:outline-none focus:ring-2 focus:ring-white transition-colors text-lg"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    onClick={handleClose}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded transition-colors"
                    aria-label="Close search"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Search Results Content */}
              <div className="max-h-96 overflow-y-auto">
                {/* Loading State */}
                {isLoading && (
                  <div className="p-8 text-center text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    <p className="mt-3 text-sm">Searching...</p>
                  </div>
                )}

                {/* No Query State - Show Recent Searches */}
                {!query && !isLoading && (
                  <div className="p-4">
                    {recentSearches.length > 0 && (
                      <>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Recent Searches
                        </h3>
                        <div className="space-y-1 mb-6">
                          {recentSearches.map((term, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearch(term)}
                              className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 rounded transition-colors"
                              aria-label={`Search for ${term}`}
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Popular Searches
                    </h3>
                    <div className="space-y-1">
                      {['NFL Draft', 'Power Rankings', 'Playoffs', 'Trade News'].map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSearch(term)}
                          className="block w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 rounded transition-colors"
                          aria-label={`Search for ${term}`}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {query && !isLoading && (
                  <div className="p-2">
                    {results.length > 0 ? (
                      <>
                        <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-600 flex items-center justify-between">
                          <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
                          <span className="text-gray-500">Press Enter to search all</span>
                        </div>
                        <div className="py-2">
                          {results.map((result, index) => (
                            <button
                              key={result._id}
                              onClick={() => handleResultClick(result)}
                              className={`w-full flex items-start gap-3 p-3 hover:bg-gray-800 rounded-lg transition-colors text-left ${
                                selectedIndex === index ? 'bg-gray-800' : ''
                              }`}
                            >
                              {/* Thumbnail */}
                              <div className="flex-shrink-0 w-12 h-12 bg-gray-700 rounded overflow-hidden">
                                {result.coverImage?.asset?.url ? (
                                  <Image
                                    src={result.coverImage.asset.url}
                                    alt={result.title}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                                    <Search className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white line-clamp-2 mb-1">
                                  {result.title}
                                </h4>
                                {result.summary && (
                                  <p className="text-xs text-gray-400 line-clamp-2 mb-1">
                                    {result.summary}
                                  </p>
                                )}
                                <div className="flex items-center text-xs text-gray-500">
                                  {result.category?.title && (
                                    <span className="mr-2">{result.category.title}</span>
                                  )}
                                  {result.author?.name && (
                                    <span>by {result.author.name}</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center text-gray-400">
                        <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg mb-1">No articles found for &ldquo;{query}&rdquo;</p>
                        <p className="text-sm mb-4">Try searching for something else</p>
                        <button
                          onClick={handleSubmitSearch}
                          className="px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          Search all articles
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Search Footer */}
              <div className="px-4 py-3 bg-gray-900 border-t border-gray-600">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>↑↓ Navigate</span>
                    <span>↵ Select</span>
                    <span>ESC Close</span>
                  </div>
                  <div className="text-gray-500">
                    Press Enter to search all articles
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

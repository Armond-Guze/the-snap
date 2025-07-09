'use client';
import { useState, useEffect } from 'react';
import { Eye, TrendingUp, Calendar, User } from 'lucide-react';

interface ArticleStats {
  _id: string;
  _type?: string;
  title: string;
  slug: { current: string };
  viewCount: number;
  date?: string;
  publishedAt?: string;
  author?: { name: string };
  category?: { title: string };
  rankingType?: string;
}

interface DashboardData {
  headlines: ArticleStats[];
  rankings: ArticleStats[];
  totalHeadlines: number;
  totalRankings: number;
  totalViews: number;
}

export default function AnalyticsDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'headlines' | 'rankings'>('all');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/dashboard?type=all');
        
        if (response.ok) {
          const result = await response.json();
          setData(result.data);
        } else if (response.status === 401) {
          setError('Unauthorized - Admin access required');
        } else {
          setError('Failed to load analytics data');
        }
      } catch (err) {
        setError('Network error');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-400">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">⚠️ {error}</div>
        <p className="text-gray-400">
          {error.includes('Unauthorized') ? 
            'You need admin access to view this page.' : 
            'Please try again later.'
          }
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Articles</p>
              <p className="text-2xl font-bold text-white">
                {data.totalHeadlines + data.totalRankings}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Views</p>
              <p className="text-2xl font-bold text-white">
                {data.totalViews.toLocaleString()}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Views per Article</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(data.totalViews / (data.totalHeadlines + data.totalRankings))}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { key: 'all', label: 'All Articles' },
            { key: 'headlines', label: 'Headlines' },
            { key: 'rankings', label: 'Rankings' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as 'all' | 'headlines' | 'rankings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.key
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {selectedTab === 'all' && (
          <>
            <h3 className="text-xl font-bold text-white mb-4">Top Headlines</h3>
            {data.headlines.slice(0, 5).map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
            
            <h3 className="text-xl font-bold text-white mb-4 mt-8">Top Rankings</h3>
            {data.rankings.slice(0, 5).map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </>
        )}
        
        {selectedTab === 'headlines' && data.headlines.map((article) => (
          <ArticleCard key={article._id} article={article} />
        ))}
        
        {selectedTab === 'rankings' && data.rankings.map((article) => (
          <ArticleCard key={article._id} article={article} />
        ))}
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: ArticleStats }) {
  const getArticleUrl = (article: ArticleStats) => {
    if (article._type === 'rankings') {
      return `/rankings/${article.slug.current}`;
    }
    return `/headlines/${article.slug.current}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <a 
            href={getArticleUrl(article)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-300 transition-colors"
          >
            <h4 className="font-semibold text-lg mb-2 line-clamp-2">
              {article.title}
            </h4>
          </a>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {article.author && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{article.author.name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(article.date || article.publishedAt || '')}</span>
            </div>
            
            {article.category && (
              <span className="px-2 py-1 bg-blue-600 rounded-full text-xs">
                {article.category.title}
              </span>
            )}
            
            {article.rankingType && (
              <span className="px-2 py-1 bg-purple-600 rounded-full text-xs">
                {article.rankingType.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-right">
          <Eye className="w-4 h-4 text-gray-400" />
          <span className="text-white font-bold">
            {(article.viewCount || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

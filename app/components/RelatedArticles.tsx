import Link from "next/link";
import Image from "next/image";
import { Calendar, TrendingUp, Eye } from "lucide-react";
import type { HeadlineListItem } from "@/types";

interface RelatedArticlesProps {
  currentSlug: string;
  articles: HeadlineListItem[];
}

export default function RelatedArticles({ 
  currentSlug, 
  articles
}: RelatedArticlesProps) {
  // Filter out current article and get smart recommendations
  const relatedArticles = articles
    .filter((article) => article.slug.current !== currentSlug)
    .slice(0, 6);

  const featuredArticles = relatedArticles.slice(0, 2);
  const recentArticles = relatedArticles.slice(2, 6);

  if (relatedArticles.length === 0) return null;

  return (
    <aside className="h-fit lg:sticky lg:top-0 space-y-8 self-start">
      {/* Trending/Featured Articles */}
      <div className="bg-black rounded-2xl p-6">
        <div className="flex items-center mb-6">
          <TrendingUp className="w-5 h-5 text-white mr-3" />
          <h2 className="text-xl font-bold  text-white">Headlines</h2>
        </div>
        <div className="space-y-6">
          {featuredArticles.map((article, index) => (
            <Link
              key={article._id}
              href={`/headlines/${article.slug.current}`}
              className="group block"
            >
              <div className="flex gap-4 p-4 rounded-xl hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-300">
                {/* Large thumbnail for featured */}
                <div className="relative w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                  {article.coverImage?.asset?.url ? (
                    <Image
                      src={article.coverImage.asset.url}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  {/* Trending badge */}
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    #{index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-gray-300 transition-colors mb-2">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="text-gray-400 text-xs line-clamp-2 mb-2">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-gray-500 space-x-3">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(article.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    {article.author?.name && (
                      <span>by {article.author.name}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
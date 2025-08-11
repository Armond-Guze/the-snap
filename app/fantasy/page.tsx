import { sanityFetch } from "@/sanity/lib/fetch";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";

interface FantasyArticle {
  _id: string;
  title: string;
  slug: { current: string };
  summary?: string;
  coverImage?: {
    asset?: { url: string };
  };
  fantasyType?: string;
  author?: { name: string };
  publishedAt?: string;
}

export default async function FantasyFootballPage() {
  const fantasyArticles: FantasyArticle[] = await sanityFetch(
    `*[_type == "fantasyFootball" && published == true] | order(priority asc, publishedAt desc) {
      _id,
      title,
      slug,
      summary,
      coverImage {
        asset->{
          url
        }
      },
      author->{
        name
      },
      fantasyType,
      publishedAt
    }`,
    {},
    { next: { revalidate: 300 } },
    []
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Fantasy Football</h1>
          <p className="text-gray-400 text-lg">
            Your complete guide to fantasy football success
          </p>
        </div>

        {fantasyArticles?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fantasyArticles.map((article) => (
              <Link 
                key={article._id} 
                href={`/fantasy/${article.slug.current}`}
                className="group"
              >
                <div className="bg-gray-900 rounded-xl overflow-hidden hover:bg-gray-800 transition-all duration-300 hover:scale-[1.02]">
                  <div className="relative h-48">
                    {article.coverImage?.asset ? (
                      <Image
                        src={urlFor(article.coverImage).width(400).height(200).url()}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-2 bg-gray-600 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <p className="text-gray-400 text-xs">Fantasy Football</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    {article.fantasyType && (
                      <span className="inline-block px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full mb-3">
                        {article.fantasyType.replace('-', ' ').toUpperCase()}
                      </span>
                    )}
                    
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-gray-300 transition-colors">
                      {article.title}
                    </h2>
                    
                    {article.summary && (
                      <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                        {article.summary}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{article.author?.name || "Staff Writer"}</span>
                      {article.publishedAt && (
                        <span>
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-400 mb-4">No Fantasy Articles Yet</h2>
            <p className="text-gray-500">
              Fantasy football content will appear here once articles are published.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

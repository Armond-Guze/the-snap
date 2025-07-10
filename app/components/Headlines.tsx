import { client } from "@/sanity/lib/client";
import { headlineQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";
import type { HeadlineListItem } from "@/types";

export default async function Headlines() {
  const headlines: HeadlineListItem[] = await client.fetch(headlineQuery);
  if (!headlines?.length) return null;

  const main = headlines[0];
  const sidebar = headlines.slice(1);

  // Helper function to get the correct URL based on content type
  const getArticleUrl = (item: HeadlineListItem) => {
    if (item._type === 'rankings') {
      return `/rankings/${item.slug.current.trim()}`;
    }
    return `/headlines/${item.slug.current.trim()}`;
  };

  return (
    <section className="relative py-24 px-6 lg:px-8 bg-deep-black">
      <div className="relative mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feature Story */}
          <div className="lg:col-span-2">
            {main?.coverImage && main?.slug?.current ? (
              <Link href={getArticleUrl(main)} className="group">
                <div className="relative h-full min-h-[500px] rounded-3xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  <Image
                    src={urlFor(main.coverImage).width(800).url()}
                    alt={main.title}
                    fill
                    className="object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-8">
                    <div className="flex items-start justify-between">
                      {main._type === 'rankings' && main.rankingType ? (
                        <div className="inline-flex items-center px-4 py-2 bg-purple-600 rounded-full backdrop-blur-sm">
                          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                          <span className="text-white text-sm font-semibold uppercase tracking-wider">
                            {main.rankingType.replace('-', ' ')} Rankings
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-4 py-2 bg-gray-800 rounded-full backdrop-blur-sm">
                          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                          <span className="text-white text-sm font-semibold uppercase tracking-wider">
                            Featured
                          </span>
                        </div>
                      )}
                      <svg
                        className="w-6 h-6 text-white/60 group-hover:text-white transition-colors duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>

                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                        {main.title || "Untitled"}
                      </h2>
                      {main.summary && (
                        <p className="text-gray-300 text-base line-clamp-3 leading-relaxed">
                          {main.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="relative h-full min-h-[500px] rounded-3xl overflow-hidden bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-black/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                <div className="relative h-full flex flex-col justify-between p-8">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-800 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                    <span className="text-white text-sm font-semibold uppercase tracking-wider">
                      No Content
                    </span>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                      No Headlines Available
                    </h2>
                    <p className="text-gray-300 text-base leading-relaxed">
                      Check back soon for the latest NFL news and updates.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Headlines */}
          <div className="lg:col-span-1 self-start">
            <div className="flex items-center mb-4">
              <div className="w-2.5 h-2.5 bg-white rounded-full mr-2"></div>
              <h3 className="text-lg font-bold text-white">Around The NFL</h3>
            </div>
            <ul className="space-y-4 text-sm">
              {sidebar.map((headline) => (
                <li key={headline._id}>
                  {headline.slug?.current ? (
                    <Link href={getArticleUrl(headline)}>
                      <div className="flex items-start gap-2.5 group cursor-pointer">
                        {headline.coverImage && (
                          <div className="relative overflow-hidden rounded-md flex-shrink-0">
                            <Image
                              src={urlFor(headline.coverImage)
                                .width(70)
                                .height(50)
                                .url()}
                              alt={headline.title}
                              width={70}
                              height={50}
                              className="w-16 h-12 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm leading-tight mb-1.5 group-hover:text-gray-300 transition-colors duration-300">
                            {headline.title}
                          </h4>
                          <div className="flex items-center justify-between text-gray-400 text-xs">
                            <span className="font-medium">
                              {headline.author?.name || "Staff Writer"}
                            </span>
                            <span>
                              3 min read
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <div className="flex-1">
                        <h4 className="text-gray-500 font-semibold text-sm leading-tight mb-1.5">
                          {headline.title || "Untitled"}
                        </h4>
                        <div className="flex items-center justify-between text-gray-500 text-xs">
                          <span>No author</span>
                          <span>No read time</span>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

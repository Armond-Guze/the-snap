import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";

interface FantasyBentoGridProps {
  textureSrc?: string;
}

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
}

export default async function FantasyBentoGrid({ textureSrc }: FantasyBentoGridProps) {
  // Updated query to use the new fantasyFootball content type
  const fantasyQuery = `*[_type == "fantasyFootball" && published == true] | order(priority asc, publishedAt desc)[0...4]{
    _id,
    title,
    slug,
    summary,
    coverImage {
      asset->{ url }
    },
    author->{
      name
    },
    fantasyType
  }`;

  const fantasyArticles: FantasyArticle[] = await client.fetch(fantasyQuery);

  return (
    <section className="relative py-16 px-6 lg:px-8 2xl:px-12 3xl:px-16">
      {textureSrc && (
        <>
          <div className="absolute inset-0 -z-20">
            <Image
              src={textureSrc}
              alt="Fantasy Football background"
              fill
              priority
              quality={100}
              className="object-cover opacity-30 md:opacity-35"
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/65 to-black/90 -z-10" />
        </>
      )}
      <div className="relative mx-auto max-w-7xl 2xl:max-w-[90rem] 3xl:max-w-[100rem] z-10">
        {/* Section Headers - Top Left */}
        <div className="mb-4 2xl:mb-6 3xl:mb-8">
          <div className="flex flex-wrap items-center gap-8 mb-3">
            <h2 className="text-xl sm:text-xl 2xl:text-2xl 3xl:text-3xl font-bold text-gray-300">
              Fantasy Football
            </h2>
          </div>
        </div>

        {/* Fantasy Football - 4 Horizontal Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 2xl:gap-6 3xl:gap-8">
          {fantasyArticles?.slice(0, 4).map((article: FantasyArticle, index: number) => (
            <div key={article._id || index}>
              {article && article.slug?.current ? (
                <Link href={`/fantasy/${article.slug.current}`} className="group">
                  <div className="relative h-[220px] 2xl:h-[260px] 3xl:h-[300px] rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                    {article.coverImage?.asset ? (
                      <Image
                        src={urlFor(article.coverImage).width(400).url()}
                        alt={article.title}
                        fill
                        className="object-cover opacity-50 group-hover:opacity-60 transition-all duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-3 bg-gray-600 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <p className="text-gray-400 text-xs font-medium">Fantasy Football</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="relative h-full flex flex-col justify-between p-6">
                      <div className="flex items-start justify-end">
                        <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      <div>
                        <h3 className="text-base 2xl:text-lg 3xl:text-xl font-bold text-white line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-xs 2xl:text-sm 3xl:text-base line-clamp-2 mt-2 text-gray-300">
                            {article.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="h-[220px] 2xl:h-[260px] 3xl:h-[300px] rounded-2xl bg-gray-900 flex items-center justify-center">
                  <p className="text-gray-400">No content available</p>
                </div>
              )}
            </div>
          ))}
          
          {/* Fill remaining slots if less than 4 articles */}
          {fantasyArticles && fantasyArticles.length < 4 && Array.from({ length: 4 - fantasyArticles.length }).map((_, index) => (
            <div key={`placeholder-${index}`} className="h-[220px] 2xl:h-[260px] 3xl:h-[300px] rounded-2xl bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Fantasy content coming soon</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

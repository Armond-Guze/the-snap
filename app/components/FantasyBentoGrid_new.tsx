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
}

export default async function FantasyBentoGrid({ textureSrc }: FantasyBentoGridProps) {
  // For now, we'll use the same query as headlines but filter for fantasy content
  // You can modify this query later to fetch from a fantasy-specific content type
  const fantasyQuery = `*[_type == "headline" && published == true] | order(_createdAt desc)[0...4]{
    _id,
    title,
    slug,
    summary,
    coverImage {
      asset->{ url }
    }
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
                <Link href={`/headlines/${article.slug.current}`} className="group">
                  <div className="relative h-[280px] 2xl:h-[320px] 3xl:h-[360px] rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                    {article.coverImage?.asset ? (
                      <Image
                        src={urlFor(article.coverImage).width(400).url()}
                        alt={article.title}
                        fill
                        className="object-cover opacity-50 group-hover:opacity-60 transition-all duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="relative h-full flex flex-col justify-between p-6">
                      <div className="flex items-start justify-end">
                        <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      <div>
                        <h3 className="text-lg 2xl:text-xl 3xl:text-2xl font-bold text-white line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-gray-300 text-sm 2xl:text-base 3xl:text-lg line-clamp-2 mt-2">
                            {article.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="h-[280px] 2xl:h-[320px] 3xl:h-[360px] rounded-2xl bg-gray-900 flex items-center justify-center">
                  <p className="text-gray-400">No content available</p>
                </div>
              )}
            </div>
          ))}
          
          {/* Fill remaining slots if less than 4 articles */}
          {fantasyArticles && fantasyArticles.length < 4 && Array.from({ length: 4 - fantasyArticles.length }).map((_, index) => (
            <div key={`placeholder-${index}`} className="h-[280px] 2xl:h-[320px] 3xl:h-[360px] rounded-2xl bg-gray-900 flex items-center justify-center">
              <p className="text-gray-400">No content available</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Deprecated experimental component: consolidated into FantasySection.
export {};

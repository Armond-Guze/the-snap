import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";

interface FantasyArticle {
  _id: string;
  title: string;
  slug?: {
    current: string;
  };
  summary?: string;
  coverImage?: {
    asset?: {
      _ref: string;
      _type: string;
    };
  };
}

interface FantasyBentoGridProps {
  textureSrc?: string;
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

  const fantasyArticles = await client.fetch(fantasyQuery);

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

        {/* Fantasy Bento Grid Layout - 2-1-2 with wider center */}
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-4 2xl:gap-6 3xl:gap-8">
          {/* Left Side - Two Small Cards */}
          <div className="lg:col-span-2 flex flex-col gap-4 2xl:gap-6 3xl:gap-8">
            {/* Top Left Card */}
            {leftArticles[0] && leftArticles[0].slug?.current ? (
              <Link href={`/headlines/${leftArticles[0].slug.current}`} className="group">
                <div className="relative h-[240px] 2xl:h-[280px] 3xl:h-[320px] rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  {leftArticles[0].coverImage?.asset ? (
                    <Image
                      src={urlFor(leftArticles[0].coverImage).width(400).url()}
                      alt={leftArticles[0].title}
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
                      <h3 className="text-lg 2xl:text-xl 3xl:text-2xl font-bold text-white line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                        {leftArticles[0].title}
                      </h3>
                      {leftArticles[0].summary && (
                        <p className="text-gray-300 text-sm 2xl:text-base 3xl:text-lg line-clamp-2 mt-2">
                          {leftArticles[0].summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="h-[240px] rounded-2xl bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400">No fantasy content available</p>
              </div>
            )}

            {/* Bottom Left Card */}
            {leftArticles[1] && leftArticles[1].slug?.current ? (
              <Link href={`/headlines/${leftArticles[1].slug.current}`} className="group">
                <div className="relative h-[240px] 2xl:h-[280px] 3xl:h-[320px] rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  {leftArticles[1].coverImage?.asset ? (
                    <Image
                      src={urlFor(leftArticles[1].coverImage).width(400).url()}
                      alt={leftArticles[1].title}
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
                      <h3 className="text-lg 2xl:text-xl 3xl:text-2xl font-bold text-white line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                        {leftArticles[1].title}
                      </h3>
                      {leftArticles[1].summary && (
                        <p className="text-gray-300 text-sm 2xl:text-base 3xl:text-lg line-clamp-2 mt-2">
                          {leftArticles[1].summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="h-[240px] rounded-2xl bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400">No fantasy content available</p>
              </div>
            )}
          </div>

          {/* Center - Large Featured Card */}
          <div className="lg:col-span-4">
            {centerArticle && centerArticle.slug?.current ? (
              <Link href={`/headlines/${centerArticle.slug.current}`} className="group">
                <div className="relative h-full min-h-[500px] 2xl:min-h-[600px] 3xl:min-h-[700px] rounded-3xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  {centerArticle.coverImage?.asset ? (
                    <Image
                      src={urlFor(centerArticle.coverImage).width(800).url()}
                      alt={centerArticle.title}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-800/60 to-purple-900/60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-8">
                    <div className="flex items-start justify-end">
                      <svg className="w-6 h-6 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-2xl lg:text-3xl 2xl:text-4xl 3xl:text-5xl font-bold text-white mb-4 line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                        {centerArticle.title}
                      </h3>
                      {centerArticle.summary && (
                        <p className="text-gray-300 text-base 2xl:text-lg 3xl:text-xl line-clamp-3 leading-relaxed">
                          {centerArticle.summary}
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
                  <div></div>
                  
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">No Content Available</h3>
                    <p className="text-gray-300 text-base leading-relaxed">Check back soon for the latest fantasy football news and analysis.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Two Small Cards */}
          <div className="lg:col-span-2 flex flex-col gap-4 2xl:gap-6 3xl:gap-8">
            {/* Top Right Card */}
            {rightArticles[0] && rightArticles[0].slug?.current ? (
              <Link href={`/headlines/${rightArticles[0].slug.current}`} className="group">
                <div className="relative h-[240px] 2xl:h-[280px] 3xl:h-[320px] rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  {rightArticles[0].coverImage?.asset ? (
                    <Image
                      src={urlFor(rightArticles[0].coverImage).width(400).url()}
                      alt={rightArticles[0].title}
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
                      <h3 className="text-lg 2xl:text-xl 3xl:text-2xl font-bold text-white line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                        {rightArticles[0].title}
                      </h3>
                      {rightArticles[0].summary && (
                        <p className="text-gray-300 text-sm 2xl:text-base 3xl:text-lg line-clamp-2 mt-2">
                          {rightArticles[0].summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="h-[240px] rounded-2xl bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400">No fantasy content available</p>
              </div>
            )}

            {/* Bottom Right Card */}
            {rightArticles[1] && rightArticles[1].slug?.current ? (
              <Link href={`/headlines/${rightArticles[1].slug.current}`} className="group">
                <div className="relative h-[240px] 2xl:h-[280px] 3xl:h-[320px] rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  {rightArticles[1].coverImage?.asset ? (
                    <Image
                      src={urlFor(rightArticles[1].coverImage).width(400).url()}
                      alt={rightArticles[1].title}
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
                      <h3 className="text-lg 2xl:text-xl 3xl:text-2xl font-bold text-white line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                        {rightArticles[1].title}
                      </h3>
                      {rightArticles[1].summary && (
                        <p className="text-gray-300 text-sm 2xl:text-base 3xl:text-lg line-clamp-2 mt-2">
                          {rightArticles[1].summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="h-[240px] rounded-2xl bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400">No fantasy content available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

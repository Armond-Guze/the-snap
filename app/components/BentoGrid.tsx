import { client } from "@/sanity/lib/client";
import { headlineQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";

interface Headline {
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

interface BentoGridProps {
  textureSrc?: string;
}

export default async function BentoGrid({ textureSrc }: BentoGridProps) {
  // Fetch data from Sanity
  const headlines = await client.fetch(headlineQuery);

  const centerHeadline = headlines?.[1]; // One for center
  const rightHeadlines = headlines?.slice(2, 4) || []; // Two for right side

  return (
    <section className="relative py-16 px-6 lg:px-8">
      {textureSrc && (
        <>
          <div className="absolute inset-0 -z-20">
            <Image
              src={textureSrc}
              alt="NFL background"
              fill
              priority
              quality={100}
              className="object-cover opacity-35"
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/65 to-black/90 -z-10" />
        </>
      )}
      <div className="relative mx-auto max-w-7xl z-10">
        {/* Section Headers - Top Left */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-8 mb-3">
            <h2 className="text-xl sm:text-xl font-bold text-gray-300">
              More Headlines
            </h2>
          </div>
        </div>

        {/* Bento Grid Layout - 3 Headlines */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Center - Large Featured Card */}
          <div className="lg:col-span-3">
            {centerHeadline && centerHeadline.slug?.current ? (
              <Link href={`/headlines/${centerHeadline.slug.current}`} className="group">
                <div className="relative h-full min-h-[500px] rounded-3xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  {centerHeadline.coverImage?.asset ? (
                    <Image
                      src={urlFor(centerHeadline.coverImage).width(800).url()}
                      alt={centerHeadline.title}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-8">
                    <div className="flex items-start justify-between">
                      <div className="inline-flex items-center px-4 py-2 bg-gray-800 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        <span className="text-white text-sm font-semibold uppercase tracking-wider">Featured</span>
                      </div>
                      <svg className="w-6 h-6 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4 line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                        {centerHeadline.title}
                      </h3>
                      {centerHeadline.summary && (
                        <p className="text-gray-300 text-base line-clamp-3 leading-relaxed">
                          {centerHeadline.summary}
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
                    <span className="text-white text-sm font-semibold uppercase tracking-wider">No Content</span>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">No Headlines Available</h3>
                    <p className="text-gray-300 text-base leading-relaxed">Check back soon for the latest NFL news and updates.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Two Small Cards */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Top Right Card */}
            {rightHeadlines[0] && rightHeadlines[0].slug?.current ? (
              <Link href={`/headlines/${rightHeadlines[0].slug.current}`} className="group">
                <div className="relative h-[240px] rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  {rightHeadlines[0].coverImage?.asset ? (
                    <Image
                      src={urlFor(rightHeadlines[0].coverImage).width(400).url()}
                      alt={rightHeadlines[0].title}
                      fill
                      className="object-cover opacity-50 group-hover:opacity-60 transition-all duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex items-start justify-between">
                      <div className="inline-flex items-center px-3 py-1 bg-gray-800 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        <span className="text-white text-xs font-semibold">News</span>
                      </div>
                      <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                        {rightHeadlines[0].title}
                      </h3>
                      {rightHeadlines[0].summary && (
                        <p className="text-gray-300 text-sm line-clamp-2 mt-2">
                          {rightHeadlines[0].summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="h-[240px] rounded-2xl bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400">No content available</p>
              </div>
            )}

            {/* Bottom Right Card */}
            {rightHeadlines[1] && rightHeadlines[1].slug?.current ? (
              <Link href={`/headlines/${rightHeadlines[1].slug.current}`} className="group">
                <div className="relative h-[240px] rounded-2xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  {rightHeadlines[1].coverImage?.asset ? (
                    <Image
                      src={urlFor(rightHeadlines[1].coverImage).width(400).url()}
                      alt={rightHeadlines[1].title}
                      fill
                      className="object-cover opacity-50 group-hover:opacity-60 transition-all duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div className="flex items-start justify-between">
                      <div className="inline-flex items-center px-3 py-1 bg-gray-800 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        <span className="text-white text-xs font-semibold">News</span>
                      </div>
                      <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                        {rightHeadlines[1].title}
                      </h3>
                      {rightHeadlines[1].summary && (
                        <p className="text-gray-300 text-sm line-clamp-2 mt-2">
                          {rightHeadlines[1].summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="h-[240px] rounded-2xl bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400">No content available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

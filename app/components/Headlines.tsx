import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";

interface HeadlineItem {
  _id: string;
  _type: string;
  title: string;
  slug: { current: string };
  summary?: string;
  coverImage?: {
    asset: {
      url: string;
    };
  };
  author?: { name: string };
  rankingType?: string;
  priority?: number;
  date?: string;
  publishedAt?: string;
  tags?: string[];
}

interface HeadlinesProps {
  /** Optional texture image path under /public (e.g., "/images/texture-image.jpg"). Applied as a decorative overlay. */
  textureSrc?: string;
}

export default async function Headlines({ textureSrc }: HeadlinesProps) {
  // Use the original query that we know works with your data
  const originalQuery = `
    *[(_type == "headline" || _type == "rankings") && published == true] | order(priority asc, _createdAt desc, publishedAt desc) {
      _id,
      _type,
      title,
      slug,
      summary,
      coverImage {
        asset->{
          url
        }
      },
      priority,
      date,
      publishedAt,
      rankingType,
      author->{
        name
      },
      tags
    }
  `;

  const headlines: HeadlineItem[] = await sanityFetch(
    originalQuery,
    {},
    { next: { revalidate: 300 } },
    []
  );

  // Debug: Log the headlines data
  console.log('Headlines data:', JSON.stringify(headlines, null, 2));

  if (!headlines?.length) {
    console.log('No headlines found');
    return null;
  }

  const main = headlines[0];
  const sidebar = headlines.slice(1, 8); // Limit to 7 sidebar headlines (positions 1-7)

  // Helper function to get the correct URL based on content type
  const getArticleUrl = (item: HeadlineItem) => {
    if (item._type === 'rankings') {
      return `/rankings/${item.slug.current.trim()}`;
    }
    return `/headlines/${item.slug.current.trim()}`;
  };

  // Safe urlFor wrapper
  const safeUrlFor = (image: HeadlineItem['coverImage']) => {
    try {
      if (!image?.asset?.url) return null;
      return urlFor(image);
    } catch (error) {
      console.warn('urlFor error:', error);
      return null;
    }
  };

  return (
    <section className="relative py-16 px-6 lg:px-8 2xl:px-12 3xl:px-16">
      {/* Background Image - use texture if provided, otherwise helmet background */}
      <div className="absolute inset-0 -z-20">
        <Image
          src={textureSrc || "/images/helmet-background.png"}
          alt="NFL background"
          fill
          priority
          quality={100}
          className="object-cover opacity-45"
          sizes="100vw"
        />
      </div>

      {/* Gradient overlay - darker at bottom, lighter at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black/85 -z-10" />

      <div className="relative z-10 mx-auto max-w-7xl 2xl:max-w-[90rem] 3xl:max-w-[100rem]">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 2xl:gap-8 3xl:gap-12">
          {/* Main Feature Story */}
          <div className="lg:col-span-2">
            {main?.coverImage?.asset?.url && main?.slug?.current ? (
              <Link href={getArticleUrl(main)} className="group">
                <div className="relative h-full min-h-[350px] sm:min-h-[400px] lg:min-h-[500px] 2xl:min-h-[600px] 3xl:min-h-[700px] rounded-3xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.02] shadow-xl hover:shadow-2xl">
                  <Image
                    src={main.coverImage.asset.url}
                    alt={main.title}
                    fill
                    className="object-cover opacity-85 group-hover:opacity-95 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

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
                      <h2 className="text-2xl lg:text-3xl 2xl:text-4xl 3xl:text-5xl font-bold text-white mb-4 line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                        {main.title || "Untitled"}
                      </h2>
                      {main.summary && (
                        <p className="text-gray-300 text-base 2xl:text-lg 3xl:text-xl line-clamp-3 leading-relaxed">
                          {main.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="relative h-full min-h-[350px] sm:min-h-[400px] lg:min-h-[500px] rounded-3xl overflow-hidden bg-gray-900">
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
              <h3 className="text-lg 2xl:text-xl 3xl:text-2xl font-bold text-white">Around The NFL</h3>
            </div>
            <ul className="space-y-4 2xl:space-y-5 3xl:space-y-6 text-sm">
              {sidebar.map((headline) => (
                <li key={headline._id}>
                  {headline.slug?.current ? (
                    <Link href={getArticleUrl(headline)}>
                      <div className="flex items-start gap-2.5 2xl:gap-3 3xl:gap-4 group cursor-pointer">
                        {headline.coverImage?.asset?.url && (
                          <div className="relative overflow-hidden rounded-md flex-shrink-0">
                            <Image
                              src={safeUrlFor(headline.coverImage)?.width(70).height(50).url() || '/images/fallback-image.jpg'}
                              alt={headline.title}
                              width={70}
                              height={50}
                              className="w-16 h-12 2xl:w-20 2xl:h-14 3xl:w-24 3xl:h-16 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-base 2xl:text-lg 3xl:text-xl leading-tight mb-1.5 group-hover:text-gray-300 transition-colors duration-300">
                            {headline.title}
                          </h4>
                          <div className="flex items-center text-gray-400 text-xs 2xl:text-sm">
                            <span className="font-medium">
                              {headline.author?.name || "Staff Writer"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <div className="flex-1">
                        <h4 className="text-gray-500 font-bold text-base leading-tight mb-1.5">
                          {headline.title || "Untitled"}
                        </h4>
                        <div className="flex items-center text-gray-500 text-xs">
                          <span>No author</span>
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

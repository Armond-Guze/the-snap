import { sanityFetch } from "@/sanity/lib/fetch";
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
  priority?: number;
  date?: string;
  publishedAt?: string;
  tags?: string[];
}

interface HeadlinesProps {
  /** Optional texture image path under /public (e.g., "/images/texture-image.jpg"). Applied as a decorative overlay. */
  textureSrc?: string;
  /** When true, summary text is suppressed (e.g., cleaner homepage). */
  hideSummaries?: boolean;
}

export default async function Headlines({ textureSrc, hideSummaries = false }: HeadlinesProps) {
  // New strategy: Use Homepage Settings singleton for manual ordering (pinnedHeadlines),
  // then append the rest of the latest published headlines.
  // If no settings or no pinned items, we just fallback to newest.

  const homepageHeadlinesQuery = `
    {
      "settings": *[_type == "homepageSettings"][0]{
        pinnedHeadlines[]->{
          _id,
          _type,
            title,
            slug,
            summary,
            coverImage { asset->{ url } },
            players[]->{ name, team, position, headshot{asset->{url}} },
            priority,
            date,
            publishedAt,
            author->{ name },
            tags,
            published
        }
      },
      "rest": *[_type == "headline" && published == true && !(_id in *[_type=="homepageSettings"][0].pinnedHeadlines[]._ref)]
        | order(_createdAt desc){
          _id,
          _type,
          title,
          slug,
          summary,
          coverImage { asset->{ url } },
          players[]->{ name, team, position, headshot{asset->{url}} },
          priority,
          date,
          publishedAt,
          author->{ name },
          tags
        }
    }
  `;

  const resultRaw = await sanityFetch(
    homepageHeadlinesQuery,
    {},
    { next: { revalidate: 300 } },
    []
  );

  interface HomepageResult { settings?: { pinnedHeadlines?: (HeadlineItem & { published?: boolean })[] }; rest?: HeadlineItem[] }
  const result: HomepageResult = resultRaw as unknown as HomepageResult;

  const pinned = (result.settings?.pinnedHeadlines || []).filter(h => h?.published !== false);
  const rest = Array.isArray(result.rest) ? result.rest : [];
  const headlines: HeadlineItem[] = [...pinned, ...rest];

  // Debug: Log the headlines data (dev only to avoid noisy production console / potential AdSense review clutter)
  if (process.env.NODE_ENV === 'development') {
    console.log('Headlines data:', JSON.stringify(headlines, null, 2));
  }

  if (!headlines?.length) {
    console.log('No headlines found');
    return null;
  }

  // Layout consumption plan:
  // main: 1 item (index 0)
  // left column (vertical images): 2 items (indexes 1-2)
  // right sidebar ("Around The NFL"): up to 6 items (indexes 3-8)
  // Remaining items start at index 9 and flow into the "More Headlines" section (MoreHeadlinesSection)
  const LEFT_IMAGE_COUNT = 2;
  const RIGHT_SIDEBAR_LIMIT = 6;
  const main = headlines[0];
  const leftColumn = headlines.slice(1, 1 + LEFT_IMAGE_COUNT);
  const rightSidebar = headlines.slice(1 + LEFT_IMAGE_COUNT, 1 + LEFT_IMAGE_COUNT + RIGHT_SIDEBAR_LIMIT);

  // Helper function to get the correct URL based on content type
  const getArticleUrl = (item: HeadlineItem) => {
    if (item._type === 'rankings') {
      return `/rankings/${item.slug.current.trim()}`;
    }
    return `/headlines/${item.slug.current.trim()}`;
  };

  return (
    <section className="relative">
      {/* Background Image - use texture if provided, otherwise helmet background */}
      <div className="absolute inset-0 -z-20">
        <Image
          src={textureSrc || "/images/helmet-background.png"}
          alt="NFL background"
          fill
          priority
          quality={100}
          className="object-cover opacity-35 md:opacity-45"
          sizes="100vw"
        />
      </div>

      {/* Gradient overlay - darker at bottom, lighter at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black/85 -z-10" />

      {/* Mobile: Full-width main headline */}
      <div className="lg:hidden">
        {main?.coverImage?.asset?.url && main?.slug?.current ? (
          <Link href={getArticleUrl(main)} className="group block">
            <div className="relative w-full h-[60vh] min-h-[400px] bg-gray-900 sm:hover:bg-gray-800 transition-all duration-500">
              <Image
                src={main.coverImage.asset.url}
                alt={main.title}
                fill
                sizes="100vw"
                className="object-cover opacity-85 sm:group-hover:opacity-95 sm:group-hover:scale-102 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="relative h-full flex flex-col justify-between p-6">
                <div className="flex items-start justify-end">
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
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                    {main.title || "Untitled"}
                  </h2>
                  {main.summary && !hideSummaries && (
                    <p className="text-gray-300 text-base line-clamp-3 leading-relaxed">
                      {main.summary}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="relative w-full h-[60vh] min-h-[400px] bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            
            <div className="relative h-full flex flex-col justify-between p-6">
              <div className="flex items-start justify-end">
                <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  No Headlines Available
                </h2>
                <p className="text-gray-300 text-base leading-relaxed">
                  Check back soon for the latest NFL news and updates.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Sidebar - Below main story */}
        <div className="px-6 py-8">
          <div className="flex items-center mb-5">
            <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
            <h3 className="text-lg font-bold text-white tracking-tight">Around The NFL</h3>
          </div>
          <ul className="space-y-4">
            {(leftColumn.concat(rightSidebar)).map((headline) => {
              const author = headline.author?.name;
              return (
                <li key={headline._id}>
                  {headline.slug?.current ? (
                    <Link
                      href={getArticleUrl(headline)}
                      className="group flex gap-4 p-3 rounded-xl border border-[#1e1e1e] bg-[#0d0d0d] hover:bg-[#161616] hover:border-[#262626] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#444]"
                    >
                      <div className="relative w-28 h-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-800/40">
                        {headline.coverImage?.asset?.url ? (
                          <Image
                            src={headline.coverImage.asset.url}
                            alt={headline.title}
                            fill
                            className="object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.05]"
                            sizes="112px"
                            priority={false}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8z"/></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 pt-1">
                        <h4 className="text-sm font-semibold leading-snug text-gray-100 group-hover:text-white line-clamp-2 mb-1">{headline.title}</h4>
                        {!hideSummaries && headline.summary && (
                          <p className="text-[11px] text-gray-400 line-clamp-2 mb-1.5">{headline.summary}</p>
                        )}
                        {author && (
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500 group-hover:text-gray-300">{author}</p>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="flex gap-4 p-3 rounded-xl border border-[#1e1e1e] bg-[#0d0d0d]">
                      <div className="relative w-28 h-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-800/40" />
                      <div className="flex flex-col flex-1 min-w-0 pt-1">
                        <h4 className="text-gray-500 font-semibold text-sm leading-snug mb-1 line-clamp-2">{headline.title || 'Untitled'}</h4>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Desktop: New layout with left sidebar */}
      <div className="hidden lg:block py-6 md:py-12 px-6 lg:px-8 2xl:px-12 3xl:px-16">
        <div className="relative z-10 mx-auto max-w-7xl 2xl:max-w-[85rem] 3xl:max-w-[95rem]">
          <div className="grid grid-cols-24 gap-3 2xl:gap-4 3xl:gap-6">
            {/* Left Sidebar - Two vertical images */}
            <div className="col-span-5 flex flex-col justify-center space-y-3">
              {leftColumn.map((headline) => (
                <div key={headline._id} className="group">
                  {headline.slug?.current ? (
                    <Link href={getArticleUrl(headline)}>
                      <div className="relative h-32 2xl:h-36 3xl:h-40 rounded-lg overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-300 hover:scale-[1.02]">
                        {headline.coverImage?.asset?.url ? (
                          <Image
                            src={headline.coverImage.asset.url}
                            alt={headline.title}
                            fill
                            sizes="(min-width:1024px) 21vw, 45vw"
                            className="object-cover opacity-85 group-hover:opacity-95 transition-opacity duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8zm0 8h3v2H8v-2zm5 0h3v2h-3v-2z"/>
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <h4 className="text-white font-bold text-xs 2xl:text-sm leading-tight line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                            {headline.title}
                          </h4>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="relative h-32 2xl:h-36 3xl:h-40 rounded-lg overflow-hidden bg-gray-900">
                      {headline.coverImage?.asset?.url ? (
                        <Image
                          src={headline.coverImage.asset.url}
                          alt={headline.title || "Untitled"}
                          fill
                          sizes="(min-width:1024px) 21vw, 45vw"
                          className="object-cover opacity-85"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8zm0 8h3v2H8v-2zm5 0h3v2h-3v-2z"/>
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h4 className="text-gray-500 font-bold text-xs leading-tight line-clamp-2">
                          {headline.title || "Untitled"}
                        </h4>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Main Feature Story - Slightly reduced width */}
            <div className="col-span-12">
              {main?.coverImage?.asset?.url && main?.slug?.current ? (
                <Link href={getArticleUrl(main)} className="group">
                  <div className="relative h-full min-h-[320px] sm:min-h-[370px] lg:min-h-[400px] 2xl:min-h-[440px] 3xl:min-h-[500px] rounded-xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.01] shadow-xl hover:shadow-2xl">
                    <Image
                      src={main.coverImage.asset.url}
                      alt={main.title}
                      fill
                      sizes="(min-width:1536px) 50vw, (min-width:1280px) 55vw, (min-width:1024px) 60vw, 100vw"
                      className="object-cover opacity-85 group-hover:opacity-95 group-hover:scale-102 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="relative h-full flex flex-col justify-between p-6">
                      <div className="flex items-start justify-end">
                        <svg
                          className="w-5 h-5 text-white/60 group-hover:text-white transition-colors duration-300"
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
                        <h2 className="text-xl lg:text-2xl 2xl:text-3xl 3xl:text-4xl font-bold text-white mb-3 line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                          {main.title || "Untitled"}
                        </h2>
                        {main.summary && !hideSummaries && (
                          <p className="text-gray-300 text-sm 2xl:text-base 3xl:text-lg line-clamp-3 leading-relaxed">
                            {main.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="relative h-full min-h-[350px] sm:min-h-[400px] lg:min-h-[500px] rounded-xl overflow-hidden bg-gray-900">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-black/60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  <div className="relative h-full flex flex-col justify-between p-8">
                    <div className="flex items-start justify-end">
                      <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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

            {/* Desktop Sidebar Headlines - Right side */}
            <div className="col-span-7 self-start space-y-4">
              {/* Around The NFL Section */}
              <div>
                <div className="flex items-center mb-3">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  <h3 className="text-base 2xl:text-lg 3xl:text-xl font-bold text-white">Around The NFL</h3>
                </div>
                <ul className="space-y-3 2xl:space-y-4 3xl:space-y-5 text-sm">
                  {rightSidebar.map((headline) => (
                    <li key={headline._id}>
                      {headline.slug?.current ? (
                        <Link href={getArticleUrl(headline)}>
                          <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="relative w-20 h-12 2xl:w-24 2xl:h-14 bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                              {headline.coverImage?.asset?.url ? (
                                <Image
                                  src={headline.coverImage.asset.url}
                                  alt={headline.title}
                                  fill
                                  sizes="128px"
                                  className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8zm0 8h3v2H8v-2zm5 0h3v2h-3v-2z"/>
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-bold text-sm 2xl:text-base leading-snug mb-1 group-hover:text-gray-300 transition-colors duration-300 line-clamp-2">
                                {headline.title}
                              </h4>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="relative w-20 h-12 2xl:w-24 2xl:h-14 bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                            {headline.coverImage?.asset?.url ? (
                              <Image
                                src={headline.coverImage.asset.url}
                                alt={headline.title || "Untitled"}
                                fill
                                sizes="128px"
                                className="object-cover object-center"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8zm0 8h3v2H8v-2zm5 0h3v2h-3v-2z"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-gray-500 font-bold text-xs leading-snug mb-1 line-clamp-2">
                              {headline.title || "Untitled"}
                            </h4>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

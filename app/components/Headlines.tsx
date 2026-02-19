import { sanityFetch } from "@/sanity/lib/fetch";
import Link from "next/link";
import Image from "next/image";
import { HERO_SIZES } from '@/lib/image-sizes';

interface HeadlineItem {
  _id: string;
  _type: string;
  format?: string;
  title: string;
  homepageTitle?: string;
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
  // textureSrc no longer used; keeping prop for compatibility but ignored
  textureSrc?: string;
  /** When true, summary text is suppressed (e.g., cleaner homepage). */
  hideSummaries?: boolean;
}

export default async function Headlines({ hideSummaries = false }: HeadlinesProps) {
  // Simple strategy: always show newest content (headline or rankings) by publishedAt desc.
  // Fetch a buffer of 20 (main page cap) – first 9 rendered here, remainder consumed by MoreHeadlinesSection.
  const newestHeadlinesQuery = `*[
    ((_type == "article" && format == "headline") || _type == "headline" || _type == "rankings") && published == true
  ]
    | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc)[0...20]{
      _id,
      _type,
      format,
      title,
      homepageTitle,
      slug,
      summary,
      coverImage { asset->{ url } },
      author->{ name },
      publishedAt,
      tags
    }`;

  const headlines = await sanityFetch<HeadlineItem[]>(
    newestHeadlinesQuery,
    {},
    { next: { revalidate: 180 } },
    []
  );

  // (Removed verbose dev console logging of headlines to keep console clean)

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
  const RIGHT_SIDEBAR_LIMIT_DESKTOP = 6;
  const RIGHT_SIDEBAR_LIMIT_MOBILE = 4; // mobile shows fewer items to avoid overwhelming the feed
  const main = headlines[0];
  const leftColumn = headlines.slice(1, 1 + LEFT_IMAGE_COUNT);
  const rightSidebar = headlines.slice(1 + LEFT_IMAGE_COUNT, 1 + LEFT_IMAGE_COUNT + RIGHT_SIDEBAR_LIMIT_DESKTOP);
  const rightSidebarMobile = headlines.slice(1 + LEFT_IMAGE_COUNT, 1 + LEFT_IMAGE_COUNT + RIGHT_SIDEBAR_LIMIT_MOBILE);

  // Helper function to get the correct URL based on content type
  const getArticleUrl = (item: HeadlineItem) => {
    if (item._type === 'rankings' || item._type === 'article') {
      return `/articles/${item.slug.current.trim()}`;
    }
    return `/headlines/${item.slug.current.trim()}`;
  };
  const formatShortDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parsed);
  };
  const mobileSidebarItems = leftColumn.concat(rightSidebarMobile);

  return (
    <section className="relative">
      {/* Clean gradient background (top lighter, bottom darker) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/35 via-black/55 to-black/85" />

      {/* Mobile: Feature hero + compact list */}
      <div className="lg:hidden px-4 pb-8 pt-3">
        {main?.coverImage?.asset?.url && main?.slug?.current ? (
          <Link href={getArticleUrl(main)} className="group block">
            <div className="relative h-[52vh] min-h-[340px] max-h-[520px] overflow-hidden rounded-2xl bg-gray-900 shadow-[0_22px_70px_rgba(0,0,0,0.45)]">
              <Image
                src={main.coverImage.asset.url}
                alt={main.title}
                fill
                priority
                sizes={HERO_SIZES}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="thumbnail-overlay-text absolute inset-x-0 top-0 flex items-center justify-between p-4">
                <span className="inline-flex rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
                  Top Story
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40">
                  <svg
                    className="h-4 w-4 text-white/80 group-hover:text-white transition-colors duration-300"
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
                </span>
              </div>

              <div className="thumbnail-overlay-text absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h2 className="mb-3 text-[1.65rem] font-bold leading-tight text-white line-clamp-3 group-hover:text-gray-200 transition-colors duration-300 sm:text-3xl">
                  {main.homepageTitle || main.title || "Untitled"}
                </h2>
                {main.summary && !hideSummaries && (
                  <p className="text-sm leading-relaxed text-gray-200/95 line-clamp-2 sm:text-base">
                    {main.summary}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <div className="relative h-[52vh] min-h-[340px] max-h-[520px] overflow-hidden rounded-2xl bg-gray-900 shadow-[0_22px_70px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            <div className="thumbnail-overlay-text absolute inset-x-0 bottom-0 p-5">
              <h2 className="mb-3 text-[1.65rem] font-bold leading-tight text-white sm:text-3xl">No Headlines Available</h2>
              <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
                Check back soon for the latest NFL news and updates.
              </p>
            </div>
          </div>
        )}

        {/* Mobile Sidebar - below hero */}
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-white">Around The NFL</h3>
            <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
              {mobileSidebarItems.length} Stories
            </span>
          </div>
          <ul className="space-y-3">
            {mobileSidebarItems.map((headline) => {
              const author = headline.author?.name;
              const published = formatShortDate(headline.publishedAt);
              return (
                <li key={headline._id}>
                  {headline.slug?.current ? (
                    <Link
                      href={getArticleUrl(headline)}
                      className="group flex gap-3.5 rounded-2xl bg-white/[0.03] p-3 transition-all duration-300 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      <div className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-800/40">
                        {headline.coverImage?.asset?.url ? (
                          <Image
                            src={headline.coverImage.asset.url}
                            alt={headline.title}
                            fill
                            className="object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.04]"
                            sizes="112px"
                            priority={false}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8z"/></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                        <div className="mb-1 flex items-center gap-2">
                          {published && <span className="text-[10px] font-medium uppercase tracking-wide text-white/45">{published}</span>}
                        </div>
                        <h4 className="mb-1 text-sm font-semibold leading-snug text-gray-100 line-clamp-2 group-hover:text-white">
                          {headline.homepageTitle || headline.title}
                        </h4>
                        {!hideSummaries && headline.summary && (
                          <p className="mb-1.5 line-clamp-2 text-[11px] leading-snug text-gray-400">{headline.summary}</p>
                        )}
                        {author && (
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500 group-hover:text-gray-300">{author}</p>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="flex gap-3.5 rounded-2xl bg-white/[0.03] p-3">
                      <div className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-800/40" />
                      <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                        <h4 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-500">
                          {headline.title || "Untitled"}
                        </h4>
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
        {/* Slightly widened container (was max-w-7xl/85rem/95rem) */}
        <div className="relative z-10 mx-auto max-w-[86rem] 2xl:max-w-[94rem] 3xl:max-w-[106rem]">
          <div className="grid grid-cols-24 gap-3 2xl:gap-4 3xl:gap-6">
            {/* Left Sidebar - Two vertical images (slightly narrowed from col-span-5 to 4) */}
            <div className="col-span-4 flex flex-col justify-center space-y-3">
              {leftColumn.map((headline) => (
                <div key={headline._id} className="group">
                  {headline.slug?.current ? (
                    <Link href={getArticleUrl(headline)}>
                      <div className="relative h-32 2xl:h-36 3xl:h-40 rounded-lg overflow-hidden bg-gray-900 hover:bg-gray-800 transition-colors duration-300">
                        {headline.coverImage?.asset?.url ? (
                          <Image
                            src={headline.coverImage.asset.url}
                            alt={headline.title}
                            fill
                            sizes="(min-width:1536px) 18vw, (min-width:1280px) 19vw, (min-width:1024px) 20vw, 45vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8zm0 8h3v2H8v-2zm5 0h3v2h-3v-2z"/>
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                        <div className="thumbnail-overlay-text absolute bottom-0 left-0 right-0 p-2">
                          <h4 className="text-white font-bold text-xs 2xl:text-sm leading-tight line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                            {headline.homepageTitle || headline.title}
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
                          sizes="(min-width:1536px) 18vw, (min-width:1280px) 19vw, (min-width:1024px) 20vw, 45vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6zm2 2h8v6H8V8zm0 8h3v2H8v-2zm5 0h3v2h-3v-2z"/>
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                      <div className="thumbnail-overlay-text absolute bottom-0 left-0 right-0 p-2">
                        <h4 className="text-gray-500 font-bold text-xs leading-tight line-clamp-2">
                          {headline.homepageTitle || headline.title || "Untitled"}
                        </h4>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Main Feature Story - widened by 1 column (12 -> 13) */}
            <div className="col-span-13">
              {main?.coverImage?.asset?.url && main?.slug?.current ? (
                <Link href={getArticleUrl(main)} className="group">
                  <div className="relative h-full min-h-[320px] sm:min-h-[370px] lg:min-h-[400px] 2xl:min-h-[440px] 3xl:min-h-[500px] rounded-xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-colors duration-500 shadow-xl hover:shadow-2xl">
                    <Image
                      src={main.coverImage.asset.url}
                      alt={main.title}
                      fill
                      priority
                      sizes="(min-width:1536px) 52vw, (min-width:1280px) 57vw, (min-width:1024px) 62vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

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

                      <div className="thumbnail-overlay-text">
                        <h2 className="text-xl lg:text-2xl 2xl:text-3xl 3xl:text-4xl font-bold text-white mb-3 line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">
                          {main.homepageTitle || main.title || "Untitled"}
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
                    
                    <div className="thumbnail-overlay-text">
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
                <ul className="space-y-3 2xl:space-y-4 3xl:space-y-5">
                  {rightSidebar.map((headline) => (
                    <li key={headline._id} className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                      {headline.slug?.current ? (
                        <Link href={getArticleUrl(headline)} className="group block">
                          <div className="mb-1 flex items-center gap-2">
                            {formatShortDate(headline.publishedAt) && (
                              <span className="text-[10px] uppercase tracking-wide text-white/45">
                                {formatShortDate(headline.publishedAt)}
                              </span>
                            )}
                          </div>
                          <h4 className="line-clamp-2 text-base 2xl:text-lg 3xl:text-xl font-semibold leading-snug text-white/90 transition-colors group-hover:text-white">
                            {headline.homepageTitle || headline.title}
                          </h4>
                        </Link>
                      ) : (
                        <div>
                          <h4 className="line-clamp-2 text-base 2xl:text-lg 3xl:text-xl font-semibold leading-snug text-gray-500">
                            {headline.homepageTitle || headline.title || "Untitled"}
                          </h4>
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

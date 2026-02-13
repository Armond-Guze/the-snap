import { sanityFetch } from "@/sanity/lib/fetch";
import Link from "next/link";
import Image from "next/image";
import { formatArticleDate } from "@/lib/date-utils";

interface FantasyArticle {
  _id: string;
  title: string;
  homepageTitle?: string;
  slug?: { current?: string };
  summary?: string;
  coverImage?: { asset?: { url?: string } };
  fantasyType?: string;
  author?: { name?: string };
  publishedAt?: string;
  priority?: number;
}

function toFantasyUrl(item: FantasyArticle): string {
  const slug = item.slug?.current?.trim();
  return slug ? `/fantasy/${slug}` : "#";
}

function formatFantasyType(type?: string): string {
  if (!type) return "Fantasy";
  return type
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPublishedDate(value?: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatArticleDate(value);
}

export default async function FantasyFootballPage() {
  const fantasyArticles: FantasyArticle[] = await sanityFetch(
    `*[_type == "fantasyFootball" && published == true] | order(priority asc, publishedAt desc) {
      _id,
      title,
  homepageTitle,
      slug,
      summary,
      coverImage { asset->{ url } },
      author->{ name },
      fantasyType,
      publishedAt,
      priority
    }`,
    {},
    { next: { revalidate: 300 } },
    []
  );

  if (!fantasyArticles?.length) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-white/10 to-black rounded-2xl flex items-center justify-center border border-white/20">
            <svg className="w-12 h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Fantasy Football</h1>
            <p className="text-gray-500 mb-6">Fantasy football content will appear here once articles are published.</p>
            <Link href="/" className="text-sm text-white/80 hover:text-white">Return Home →</Link>
        </div>
      </div>
    );
  }

  const stories = fantasyArticles.filter((item) => !!item.slug?.current?.trim());
  const [topStory, ...moreStories] = stories;
  const headerImage =
    topStory?.coverImage?.asset?.url ||
    fantasyArticles.find((item) => item.coverImage?.asset?.url)?.coverImage?.asset?.url;
  const topStoryDate = topStory ? getPublishedDate(topStory.publishedAt) : null;

  return (
    <main className="min-h-screen bg-[hsl(0_0%_3.9%)] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/90" />
        {headerImage && (
          <Image
            src={headerImage}
            alt="Fantasy Football"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
        )}

        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">Fantasy Latest</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/85">
            Latest fantasy football strategy, matchup breakdowns, waiver targets, and lineup decisions.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {topStory ? (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <Link
              href={toFantasyUrl(topStory)}
              className="group overflow-hidden rounded-2xl bg-white/[0.04] transition-colors hover:bg-white/[0.08]"
            >
              <div className="relative h-72 w-full sm:h-96">
                {topStory.coverImage?.asset?.url ? (
                  <Image
                    src={topStory.coverImage.asset.url}
                    alt={topStory.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 70vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="mb-2 flex items-center gap-2 text-[11px] text-white/70">
                    <span className="inline-flex rounded-full bg-emerald-300 px-2 py-0.5 font-semibold uppercase tracking-wide text-black">
                      {formatFantasyType(topStory.fantasyType)}
                    </span>
                    {topStoryDate && <span>{topStoryDate}</span>}
                  </div>
                  <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                    {topStory.homepageTitle || topStory.title}
                  </h2>
                  {topStory.summary && <p className="mt-2 line-clamp-2 text-sm text-white/85">{topStory.summary}</p>}
                </div>
              </div>
            </Link>

            <div className="space-y-3">
              {moreStories.slice(0, 4).map((item) => (
                <Link
                  key={item._id}
                  href={toFantasyUrl(item)}
                  className="group flex gap-3 rounded-xl bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.08]"
                >
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                    {item.coverImage?.asset?.url ? (
                      <Image
                        src={item.coverImage.asset.url}
                        alt={item.title}
                        fill
                        sizes="112px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/50">
                      {formatFantasyType(item.fantasyType)}
                    </p>
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-white/90">
                      {item.homepageTitle || item.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-white/45">
                      {getPublishedDate(item.publishedAt) || (item.author?.name ? `By ${item.author.name}` : "Fantasy")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/[0.03] p-6 text-white/70">No fantasy stories yet.</div>
        )}

        {moreStories.length > 4 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moreStories.slice(4).map((item) => (
              <Link
                key={item._id}
                href={toFantasyUrl(item)}
                className="group rounded-xl bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.08]"
              >
                <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/45">
                  {formatFantasyType(item.fantasyType)}
                </p>
                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white group-hover:text-white/90">
                  {item.homepageTitle || item.title}
                </h3>
                {item.summary && <p className="mt-2 line-clamp-2 text-sm text-white/60">{item.summary}</p>}
                <p className="mt-3 text-xs text-white/45">
                  {getPublishedDate(item.publishedAt) || (item.author?.name ? `By ${item.author.name}` : "Fantasy")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

import { sanityFetch } from "@/sanity/lib/fetch";
import Link from "next/link";
import Image from "next/image";
import { HERO_SIZES, CARD_SIZES, THUMB_SIZES } from '@/lib/image-sizes';
import { urlFor } from "@/sanity/lib/image";

interface FantasyArticle {
  _id: string;
  title: string;
  homepageTitle?: string;
  slug: { current: string };
  summary?: string;
  coverImage?: { asset?: { url: string } };
  fantasyType?: string;
  author?: { name: string };
  publishedAt?: string;
  priority?: number;
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
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-800/40 to-black rounded-2xl flex items-center justify-center border border-purple-600/30">
            <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Fantasy Football</h1>
            <p className="text-gray-500 mb-6">Fantasy football content will appear here once articles are published.</p>
            <Link href="/" className="text-sm text-purple-400 hover:text-purple-300">Return Home →</Link>
        </div>
      </div>
    );
  }

  // Featured article (first by priority, then date)
  const [featured, ...rest] = fantasyArticles;

  // Quick picks: next 4
  const quickPicks = rest.slice(0, 4);

  // Group remaining by fantasyType
  const grouped: Record<string, FantasyArticle[]> = {};
  rest.slice(4).forEach(a => {
    const key = a.fantasyType || 'general';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });
  const typeOrder = Object.keys(grouped).sort();

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(120,119,198,0.15),transparent_60%),radial-gradient(circle_at_80%_40%,rgba(0,212,255,0.12),transparent_55%)]" />
        <div className="absolute inset-0 backdrop-grain mix-blend-overlay" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-32">
        {/* Header / Hero */}
        <header className="mb-16">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Featured Card */}
            <Link href={`/fantasy/${featured.slug.current}`} className="group relative flex-1 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900/60 via-purple-800/40 to-indigo-900/40 border border-purple-500/20 hover:border-purple-400/40 transition-all shadow-[0_0_0_1px_rgba(168,85,247,0.2)] hover:shadow-purple-600/20">
              <div className="absolute inset-0">
                {featured.coverImage?.asset?.url && (
                  <Image
                    src={urlFor(featured.coverImage).width(1200).height(650).url()}
                    alt={featured.title}
                    fill
                    sizes={HERO_SIZES}
                    className="object-cover opacity-35 group-hover:opacity-45 transition-opacity duration-500"
                    priority
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              </div>
              <div className="relative h-full flex flex-col justify-end p-10">
                {featured.fantasyType && (
                  <span className="inline-block px-4 py-1.5 text-[11px] tracking-wide rounded-full bg-purple-600/80 text-white font-semibold ring-1 ring-white/10 mb-5">
                    {featured.fantasyType.replace('-', ' ').toUpperCase()}
                  </span>
                )}
                <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-5 max-w-3xl drop-shadow-lg">
                  <span className="bg-gradient-to-r from-white via-purple-50 to-purple-200 bg-clip-text text-transparent">
                    {featured.homepageTitle || featured.title}
                  </span>

                </h1>
                {featured.summary && (
                  <p className="max-w-2xl text-gray-300 text-base md:text-lg leading-relaxed line-clamp-3">
                    {featured.summary}
                  </p>
                )}
                <div className="mt-6 flex items-center text-xs text-purple-200/70">
                  <span>{featured.author?.name || 'Staff Writer'}</span>
                  {featured.publishedAt && <span className="mx-2">•</span>}
                  {featured.publishedAt && (
                    <time dateTime={featured.publishedAt}>{new Date(featured.publishedAt).toLocaleDateString()}</time>
                  )}
                </div>
              </div>
              <div className="absolute top-4 right-4 text-[11px] font-medium tracking-wide bg-black/50 border border-purple-400/30 px-3 py-1 rounded-full text-purple-200">
                FEATURED
              </div>
            </Link>

            {/* Quick Picks */}
            <div className="w-full lg:w-80 flex flex-col">
              <h2 className="text-sm font-semibold tracking-wider text-purple-200 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> QUICK PICKS
              </h2>
              <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible snap-x pb-2 pr-2 -mr-6 lg:mr-0">
                {quickPicks.map((qp) => (
                  <Link
                    key={qp._id}
                    href={`/fantasy/${qp.slug.current}`}
                    className="group shrink-0 basis-[85%] min-w-[85%] sm:basis-[70%] sm:min-w-[70%] md:w-64 md:min-w-0 lg:w-auto lg:min-w-0 snap-start"
                  >
                    <div className="relative rounded-xl h-40 overflow-hidden border border-white/10 hover:border-purple-400/40 bg-white/[0.02] backdrop-blur-sm transition-all">
                      {qp.coverImage?.asset?.url && (
                        <Image
                          src={urlFor(qp.coverImage).width(400).height(260).url()}
                          alt={qp.title}
                          fill
                          sizes={CARD_SIZES}
                          className="object-cover opacity-40 group-hover:opacity-55 transition-opacity"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="relative p-4 flex flex-col justify-end h-full">
                        <h3 className="text-sm font-semibold leading-snug text-gray-100 line-clamp-3 group-hover:text-white">
                          {qp.homepageTitle || qp.title}

                        </h3>
                        {qp.fantasyType && (
                          <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full bg-purple-600/70 text-white font-medium tracking-wide">
                            {qp.fantasyType.replace('-', ' ').toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                {quickPicks.length === 0 && (
                  <div className="text-xs text-gray-500 italic py-6">No quick picks</div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Type Navigation */}
        {typeOrder.length > 1 && (
          <div className="mb-10 flex flex-wrap gap-2">
            {typeOrder.map(type => (
              <a key={type} href={`#type-${type}`} className="group relative px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full bg-white/[0.04] hover:bg-purple-600/30 border border-white/10 hover:border-purple-400/40 text-purple-200/80 hover:text-white transition-all">
                <span className="capitalize">{type.replace('-', ' ')}</span>
              </a>
            ))}
          </div>
        )}

        {/* Grouped Lists */}
        <div className="space-y-20">
          {typeOrder.map(type => {
            const items = grouped[type];
            if (!items.length) return null;
            return (
              <section key={type} id={`type-${type}`} className="scroll-mt-28">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-purple-200 via-white to-white bg-clip-text text-transparent capitalize">{type.replace('-', ' ')}</span>
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-purple-500/40 via-transparent" />
                </div>
                <ul className="divide-y divide-white/5 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm bg-white/[0.015]">
                  {items.map((a, idx) => (
                    <li key={a._id} className="group relative">
                      <Link href={`/fantasy/${a.slug.current}`} className="flex gap-5 p-5 md:p-6 hover:bg-white/[0.04] transition-colors">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-purple-900/30 border border-purple-500/20">
                          {a.coverImage?.asset?.url && (
                            <Image
                              src={urlFor(a.coverImage).width(180).height(180).url()}
                              alt={a.title}
                              fill
                              sizes={THUMB_SIZES}
                              className="object-cover object-center md:group-hover:scale-[1.05] transition-transform opacity-70 md:group-hover:opacity-90"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40" />
                          <span className="absolute top-1 left-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/60 text-purple-200 border border-white/10">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-semibold leading-tight text-white line-clamp-2 group-hover:text-purple-200">
                            {a.homepageTitle || a.title}

                          </h3>
                          {a.summary && (
                            <p className="mt-2 text-xs md:text-sm text-gray-400 line-clamp-2 md:line-clamp-3">
                              {a.summary}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-3 text-[11px] uppercase tracking-wider text-purple-300/60 font-medium">
                            <span>{a.author?.name || 'Staff'}</span>
                            {a.publishedAt && <span>• {new Date(a.publishedAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="hidden md:flex items-center text-purple-300/40 group-hover:text-purple-200 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { sanityFetch } from "@/sanity/lib/fetch";
import Link from "next/link";
import Image from "next/image";
import { HERO_SIZES, CARD_SIZES } from '@/lib/image-sizes';
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

  // Basic ordering: first is featured, next 4 quick picks, rest grouped.
  const [featured, ...rest] = fantasyArticles;
  const quickPicks = rest.slice(0, 4);
  const remaining = rest.slice(4);

  // Group remaining by fantasyType
  const groups: Record<string, FantasyArticle[]> = {};
  for (const a of remaining) {
    const type = a.fantasyType || 'general-tips';
    if (!groups[type]) groups[type] = [];
    groups[type].push(a);
  }

  const preferredOrder = [
    'start-sit',
    'waiver-wire',
    'player-analysis',
    'week-preview',
    'injury-report',
    'trade-analysis',
    'draft-strategy',
    'general-tips'
  ];
  const orderedTypes = [
    ...preferredOrder.filter(t => Object.keys(groups).includes(t)),
    ...Object.keys(groups).filter(t => !preferredOrder.includes(t)).sort()
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24">
        {/* Featured */}
        <header className="mb-16">
          <div className="grid lg:grid-cols-3 gap-10 items-stretch">
            <Link href={`/fantasy/${featured.slug.current}`} className="relative group rounded-2xl overflow-hidden lg:col-span-2 border border-white/10 bg-neutral-900">
              {featured.coverImage?.asset?.url && (
                <Image
                  src={urlFor(featured.coverImage).width(1400).height(700).url()}
                  alt={featured.title}
                  fill
                  className="object-cover"
                  sizes={HERO_SIZES}
                  priority
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="relative p-8 sm:p-10 flex flex-col justify-end h-[360px] md:h-[460px]">
                {featured.fantasyType && (
                  <span className="mb-4 inline-block text-[11px] font-medium tracking-wider bg-white/15 px-3 py-1 rounded-full">
                    {featured.fantasyType.replace('-', ' ').toUpperCase()}
                  </span>
                )}
                <h1 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-2xl">
                  {featured.homepageTitle || featured.title}
                </h1>
                {featured.summary && (
                  <p className="mt-4 text-sm md:text-base text-gray-300 max-w-xl line-clamp-3">{featured.summary}</p>
                )}
                <div className="mt-6 text-xs text-gray-400">
                  {(featured.author?.name || 'Staff Writer')}{featured.publishedAt ? ` • ${new Date(featured.publishedAt).toLocaleDateString()}` : ''}
                </div>
                <span className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider bg-black/70 border border-white/10 rounded-full px-3 py-1">FEATURED</span>
              </div>
            </Link>
            {quickPicks.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-sm font-semibold tracking-wider text-gray-300">QUICK PICKS</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {quickPicks.map(qp => (
                    <Link key={qp._id} href={`/fantasy/${qp.slug.current}`} className="group relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900 hover:bg-neutral-800 transition-colors">
                      {qp.coverImage?.asset?.url && (
                        <Image
                          src={urlFor(qp.coverImage).width(400).height(260).url()}
                          alt={qp.title}
                          fill
                          sizes={CARD_SIZES}
                          className="object-cover opacity-35 group-hover:opacity-50 transition-opacity"/>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="relative p-4 h-40 flex flex-col justify-end">
                        <h3 className="text-sm font-semibold leading-snug line-clamp-3">{qp.homepageTitle || qp.title}</h3>
                        {qp.fantasyType && (
                          <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/10">{qp.fantasyType.replace('-', ' ').toUpperCase()}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Type navigation simple */}
        {orderedTypes.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {orderedTypes.map(t => (
              <a key={t} href={`#type-${t}`} className="px-4 py-1.5 text-xs font-medium tracking-wide rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 transition">
                {t.replace('-', ' ')}
              </a>
            ))}
          </div>
        )}

        {/* Group sections */}
        <div className="space-y-20">
          {orderedTypes.map(type => {
            const items = groups[type];
            if (!items?.length) return null;
            return (
              <section key={type} id={`type-${type}`} className="scroll-mt-28">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold capitalize">{type.replace('-', ' ')}</h2>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map(item => (
                    <Link key={item._id} href={`/fantasy/${item.slug.current}`} className="group relative border border-white/10 rounded-xl overflow-hidden bg-neutral-900 hover:bg-neutral-800 transition-colors">
                      {item.coverImage?.asset?.url && (
                        <div className="relative h-40">
                          <Image
                            src={urlFor(item.coverImage).width(600).height(360).url()}
                            alt={item.title}
                            fill
                            sizes={CARD_SIZES}
                            className="object-cover opacity-40 group-hover:opacity-55 transition-opacity" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                          {item.fantasyType && (
                            <span className="absolute top-3 left-3 inline-block text-[10px] font-semibold bg-black/60 px-2 py-0.5 rounded-full tracking-wide">{item.fantasyType.replace('-', ' ').toUpperCase()}</span>
                          )}
                        </div>
                      )}
                      <div className="p-4 flex flex-col gap-2">
                        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{item.homepageTitle || item.title}</h3>
                        {item.summary && <p className="text-xs text-gray-400 line-clamp-2">{item.summary}</p>}
                        <div className="mt-auto text-[10px] uppercase tracking-wider text-gray-500">
                          {(item.author?.name || 'Staff')}{item.publishedAt ? ` • ${new Date(item.publishedAt).toLocaleDateString()}` : ''}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

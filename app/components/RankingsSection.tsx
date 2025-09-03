import { sanityFetch } from "@/sanity/lib/fetch";
import Link from "next/link";
import Image from "next/image";

interface RankingItem { _id: string; _type: string; title: string; slug: { current: string }; summary?: string; excerpt?: string; coverImage?: { asset?: { _ref: string; _type: string; url?: string } }; articleImage?: { asset?: { _ref: string; _type: string; url?: string } }; author?: { name: string }; rankingType?: string; priority?: number; publishedAt?: string; week?: number; }
interface RankingsSectionProps { textureSrc?: string; hideSummaries?: boolean; }

export default async function RankingsSection({ textureSrc, hideSummaries = false }: RankingsSectionProps) {
  const rankingsQuery = `*[_type == "rankings" && published == true] | order(priority asc, publishedAt desc, _createdAt desc) [0...6] { _id,_type,title,slug,summary,excerpt,coverImage{asset->{_ref,_type,url}},articleImage{asset->{_ref,_type,url}},author->{name},rankingType,priority,publishedAt,week }`;
  const rankings: RankingItem[] = await sanityFetch(rankingsQuery, {}, { next: { revalidate: 300 } }, []);
  if (!rankings?.length) return null;
  const mainRanking = rankings[0];
  const sideRankings = rankings.slice(1, 6) || [];
  const getRankingUrl = (item: RankingItem) => `/rankings/${item.slug.current.trim()}`;
  return (
    <section className="relative py-10 px-6 lg:px-8 2xl:px-10 3xl:px-12">
      {textureSrc && (<><div className="absolute inset-0 -z-20"><Image src={textureSrc} alt="NFL background" fill priority quality={100} className="object-cover opacity-30 md:opacity-35" sizes="100vw" /></div><div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/65 to-black/90 -z-10" /></>)}
      <div className="relative mx-auto max-w-7xl 2xl:max-w-[80rem] 3xl:max-w-[88rem] z-10">
        <div className="mb-4 2xl:mb-5 3xl:mb-6"><div className="flex flex-wrap items-center gap-8 mb-3"><h2 className="text-lg sm:text-xl 2xl:text-xl 3xl:text-2xl font-bold text-gray-300 tracking-tight">Latest Rankings</h2></div></div>
        <div className="lg:hidden space-y-6">
          {mainRanking && mainRanking.slug?.current && (
            <Link href={getRankingUrl(mainRanking)} className="block group">
              <div className="relative w-screen h-72 sm:h-80 left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
                {mainRanking.coverImage?.asset?.url ? (<Image src={mainRanking.coverImage.asset.url} alt={mainRanking.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.05]" sizes="(max-width:640px) 100vw" />) : (<div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400 text-sm">No Image</div>)}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 pb-4">
                  <h3 className="text-lg font-bold text-white leading-snug line-clamp-3 group-hover:text-gray-300">{mainRanking.title}</h3>
                  {(mainRanking.summary || mainRanking.excerpt) && !hideSummaries && (<p className="mt-2 text-sm text-gray-200/90 line-clamp-3 leading-snug">{mainRanking.summary || mainRanking.excerpt}</p>)}
                </div>
              </div>
            </Link>
          )}
          {sideRankings.length > 0 && (
            <div className="space-y-6">
              {sideRankings.slice(0, 2).map((item) => (
                <Link key={item._id} href={getRankingUrl(item)} className="block group">
                  <div className="relative w-full h-72 sm:h-80 rounded-md overflow-hidden mr-2 ml-1">
                    {item.coverImage?.asset?.url ? (<Image src={item.coverImage.asset.url} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.05]" sizes="(max-width:640px) 100vw" />) : (<div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400 text-xs">No Image</div>)}
                  </div>
                  <h3 className="mt-3 mr-2 ml-1 text-base font-semibold text-white line-clamp-2 leading-snug group-hover:text-gray-300">{item.title}</h3>
                  {(item.summary || item.excerpt) && !hideSummaries && (<p className="mt-1 mr-2 ml-1 text-xs text-gray-400 line-clamp-2 leading-snug">{item.summary || item.excerpt}</p>)}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-5 gap-3 2xl:gap-4 3xl:gap-5">
          <div className="lg:col-span-3">
            {mainRanking && mainRanking.slug?.current ? (
              <Link href={getRankingUrl(mainRanking)} className="group">
                <div className="relative h-full min-h-[380px] 2xl:min-h-[460px] 3xl:min-h-[520px] rounded-xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-400 hover:scale-[1.005] shadow-lg hover:shadow-xl">
                  {mainRanking.coverImage?.asset?.url ? (<Image src={mainRanking.coverImage.asset.url} alt={mainRanking.title} fill className="object-cover opacity-60 group-hover:opacity-70 group-hover:scale-102 transition-all duration-700" />) : (<div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60" />)}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="relative h-full flex flex-col justify-between p-6 2xl:p-7 3xl:p-8">
                    <div className="flex items-start justify-end"><svg className="w-6 h-6 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
                    <div><h3 className="text-xl lg:text-2xl 2xl:text-3xl 3xl:text-4xl font-bold text-white mb-3 line-clamp-3 group-hover:text-gray-300 transition-colors duration-300">{mainRanking.title}</h3>{(mainRanking.summary || mainRanking.excerpt) && !hideSummaries && (<p className="text-gray-300 text-base 2xl:text-lg 3xl:text-xl line-clamp-3 leading-relaxed">{mainRanking.summary || mainRanking.excerpt}</p>)}</div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="relative h-full min-h-[500px] rounded-xl overflow-hidden bg-gray-900"><div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-black/60" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" /><div className="relative h-full flex flex-col justify-between p-8"><div className="flex items-start justify-end"><svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div><div><h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">No Rankings Available</h3><p className="text-gray-300 text-base leading-relaxed">Check back soon for the latest NFL rankings and analysis.</p></div></div></div>
            )}
          </div>
          <div className="lg:col-span-2 flex flex-col gap-4 2xl:gap-6 3xl:gap-8">
            {[0,1].map(i => (
              <div key={i}>
                {sideRankings[i] && sideRankings[i].slug?.current ? (
                  <Link href={getRankingUrl(sideRankings[i])} className="group">
                    <div className="relative h-[200px] 2xl:h-[230px] 3xl:h-[260px] rounded-lg overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-400 hover:scale-[1.005] shadow-lg hover:shadow-xl">
                      {sideRankings[i].coverImage?.asset?.url ? (<Image src={sideRankings[i].coverImage.asset.url} alt={sideRankings[i].title} fill className="object-cover opacity-50 group-hover:opacity-60 transition-all duration-500" />) : (<div className="absolute inset-0 bg-gradient-to-br from-gray-800/60 to-gray-900/60" />)}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="relative h-full flex flex-col justify-between p-5 2xl:p-6"><div className="flex items-start justify-end"><svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div><div><h3 className="text-base 2xl:text-lg 3xl:text-xl font-bold text-white line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">{sideRankings[i].title}</h3>{(sideRankings[i].summary || sideRankings[i].excerpt) && !hideSummaries && (<p className="text-gray-300 text-sm 2xl:text-base 3xl:text-lg line-clamp-2 mt-2">{sideRankings[i].summary || sideRankings[i].excerpt}</p>)}</div></div>
                    </div>
                  </Link>
                ) : (
                  <div className="h-[240px] rounded-lg bg-gray-900 flex items-center justify-center"><p className="text-gray-400">No rankings available</p></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

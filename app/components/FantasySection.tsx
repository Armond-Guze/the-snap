import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";

interface FantasySectionProps { textureSrc?: string; hideSummaries?: boolean; }
interface FantasyArticle { _id: string; title: string; slug: { current: string }; summary?: string; coverImage?: { asset?: { url: string } }; fantasyType?: string; author?: { name: string }; }

export default async function FantasySection({ textureSrc, hideSummaries = false }: FantasySectionProps) {
  const fantasyQuery = `*[_type == "fantasyFootball" && published == true] | order(priority asc, publishedAt desc)[0...4]{ _id, title, slug, summary, coverImage { asset->{ url } }, author->{ name }, fantasyType }`;
  const fantasyArticles: FantasyArticle[] = await client.fetch(fantasyQuery);
  return (
    <section className="relative py-16 px-6 lg:px-8 2xl:px-12 3xl:px-16">
      {textureSrc && (<><div className="absolute inset-0 -z-20"><Image src={textureSrc} alt="Fantasy Football background" fill priority quality={100} className="object-cover opacity-30 md:opacity-35" sizes="100vw" /></div><div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/65 to-black/90 -z-10" /></>)}
      <div className="relative mx-auto max-w-7xl 2xl:max-w-[90rem] 3xl:max-w-[100rem] z-10">
        <div className="mb-4 2xl:mb-6 3xl:mb-8"><div className="flex flex-wrap items-center gap-8 mb-3"><h2 className="text-xl sm:text-xl 2xl:text-2xl 3xl:text-3xl font-bold text-gray-300">Fantasy Football</h2></div></div>
        <div className="md:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          <div className="flex gap-4 pl-16 pr-10">
            <div className="shrink-0 w-2 sm:w-4" aria-hidden="true" />
            {fantasyArticles?.slice(0,4).map((article: FantasyArticle, index: number) => (
              <div key={article._id || index} className="snap-start shrink-0 w-[88%]">
                {article.slug?.current ? (
                  <Link href={`/fantasy/${article.slug.current}`} className="group block">
                    <div className="space-y-3">
                      <div className="relative h-48 rounded-xl overflow-hidden bg-gray-900 shadow-lg">
                        {article.coverImage?.asset ? (<Image src={urlFor(article.coverImage).width(800).height(600).fit('crop').url()} alt={article.title} fill className="object-cover object-left-top group-hover:scale-[1.03] transition-transform duration-500" sizes="(max-width:640px) 88vw" />) : (<div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center"><span className="text-gray-400 text-xs">No Image</span></div>)}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                        <div className="absolute top-3 right-3"><svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
                      </div>
                      <div className="px-0">
                        <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug mb-1 group-hover:text-gray-300">{article.title}</h3>
                        {article.summary && !hideSummaries && (<p className="text-[11px] text-gray-400 line-clamp-2 leading-snug">{article.summary}</p>)}
                        {article.author?.name && (<p className="text-[10px] text-gray-500 mt-1 font-medium uppercase tracking-wide">By {article.author.name}</p>)}
                      </div>
                    </div>
                  </Link>
                ) : (<div className="h-48 rounded-xl bg-gray-900 flex items-center justify-center text-gray-500 text-sm">No content</div>)}
              </div>
            ))}
            <div className="shrink-0 w-2 sm:w-4" aria-hidden="true" />
          </div>
        </div>
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 2xl:gap-6 3xl:gap-8">
          {fantasyArticles?.slice(0, 4).map((article: FantasyArticle, index: number) => (
            <div key={article._id || index}>
              {article && article.slug?.current ? (
                <Link href={`/fantasy/${article.slug.current}`} className="group">
                  <div className="space-y-3">
                    <div className="relative h-[200px] 2xl:h-[220px] 3xl:h-[250px] rounded-xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.01] shadow-xl hover:shadow-2xl">
                      {article.coverImage?.asset ? (<Image src={urlFor(article.coverImage).width(800).height(600).fit('crop').url()} alt={article.title} fill className="object-cover object-left-top opacity-90 group-hover:opacity-100 transition-all duration-500" sizes="(max-width:1024px) 50vw, 25vw" />) : (<div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800"><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className="w-16 h-16 mx-auto mb-3 bg-gray-600 rounded-full flex items-center justify-center"><svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div><p className="text-gray-400 text-xs font-medium">Fantasy Football</p></div></div></div>)}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent pointer-events-none" />
                      <div className="absolute top-3 right-3"><svg className="w-4 h-4 text-white/60 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
                    </div>
                    <div className="px-1">
                      <h3 className="text-base 2xl:text-lg 3xl:text-xl font-bold text-white line-clamp-2 group-hover:text-gray-300 transition-colors duration-300 mb-2">{article.title}</h3>
                      {article.summary && !hideSummaries && (<p className="text-xs 2xl:text-sm 3xl:text-base line-clamp-2 text-gray-400 leading-relaxed">{article.summary}</p>)}
                      {article.author?.name && (<p className="text-xs text-gray-500 mt-2 font-medium">By {article.author.name}</p>)}
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="space-y-3"><div className="h-[200px] 2xl:h-[220px] 3xl:h-[250px] rounded-xl bg-gray-900 flex items-center justify-center"><p className="text-gray-400">No content available</p></div><div className="px-1"><p className="text-gray-500 text-sm">Content unavailable</p></div></div>
              )}
            </div>
          ))}
          {fantasyArticles && fantasyArticles.length < 4 && Array.from({ length: 4 - fantasyArticles.length }).map((_, index) => (
            <div key={`placeholder-${index}`} className="space-y-3"><div className="h-[200px] 2xl:h-[220px] 3xl:h-[250px] rounded-xl bg-gray-900 flex items-center justify-center"><div className="text-center"><div className="w-16 h-16 mx-auto mb-3 bg-gray-700 rounded-full flex items-center justify-center"><svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div></div></div><div className="px-1"><p className="text-gray-500 text-sm">Fantasy content coming soon</p></div></div>
          ))}
        </div>
      </div>
    </section>
  );
}

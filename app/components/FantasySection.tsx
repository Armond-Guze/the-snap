import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";

interface FantasySectionProps { textureSrc?: string; hideSummaries?: boolean; }
interface FantasyArticle { _type: "fantasyFootball" | "article"; _id: string; title: string; slug?: { current?: string }; summary?: string; coverImage?: { asset?: { url: string } }; fantasyType?: string; format?: string; author?: { name: string }; }

function toFantasyUrl(article: FantasyArticle): string {
  const slug = article.slug?.current?.trim();
  if (!slug) return "#";
  return article._type === "article" ? `/articles/${slug}` : `/fantasy/${slug}`;
}

function dedupeFantasyArticles(items: FantasyArticle[]): FantasyArticle[] {
  const seen = new Set<string>();
  const deduped: FantasyArticle[] = [];
  for (const item of items) {
    const slugKey = item.slug?.current?.trim().toLowerCase();
    const key = slugKey && slugKey.length > 0 ? slugKey : item._id;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

export default async function FantasySection({ hideSummaries = false }: FantasySectionProps) {
  const fantasyQuery = `*[
    published == true &&
    !(_id in path("drafts.**")) &&
    (
      (_type == "article" && (format == "fantasy" || "fantasy" in coalesce(additionalFormats, []))) ||
      (
        _type == "fantasyFootball" &&
        !(slug.current in *[
          _type == "article" &&
          published == true &&
          !(_id in path("drafts.**")) &&
          (format == "fantasy" || "fantasy" in coalesce(additionalFormats, []))
        ].slug.current)
      )
    )
  ] | order(coalesce(publishedAt, date, _createdAt) desc, coalesce(priority, 999) asc)[0...4]{
    _type,
    _id,
    title,
    slug,
    summary,
    coverImage { asset->{ url } },
    author->{ name },
    fantasyType,
    format
  }`;
  const fantasyArticlesRaw: FantasyArticle[] = await client.fetch(fantasyQuery);
  const fantasyArticles = dedupeFantasyArticles(fantasyArticlesRaw);
  const mobileFantasy = fantasyArticles?.slice(0, 3) || [];
  return (
    <section className="relative py-16 px-4 lg:px-8 2xl:px-12 3xl:px-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/65 to-black/90" />
      <div className="relative mx-auto max-w-[84rem] 2xl:max-w-[94rem] 3xl:max-w-[106rem] z-10">
        <div className="mb-4 2xl:mb-6 3xl:mb-8"><div className="flex flex-wrap items-center gap-8 mb-3"><h2 className="text-xl sm:text-xl 2xl:text-2xl 3xl:text-3xl font-bold text-gray-300">Fantasy Football</h2></div></div>
        <div className="md:hidden space-y-3">
          {mobileFantasy.map((article: FantasyArticle, index: number) => (
            <div key={article._id || index}>
              {article.slug?.current ? (
                <Link
                  href={toFantasyUrl(article)}
                  className="group flex gap-3 rounded-2xl bg-white/[0.03] p-3 transition-all duration-300 hover:bg-white/[0.07]"
                >
                  <div className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-900">
                    {article.coverImage?.asset ? (
                      <Image
                        src={urlFor(article.coverImage).width(600).height(450).fit("crop").url()}
                        alt={article.title}
                        fill
                        sizes="112px"
                        className="object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <span className="mb-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                      Fantasy
                    </span>
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white group-hover:text-gray-200">
                      {article.title}
                    </h3>
                    {article.summary && !hideSummaries && (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-400">{article.summary}</p>
                    )}
                    {article.author?.name && (
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">By {article.author.name}</p>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="rounded-2xl bg-white/[0.03] p-3 text-sm text-gray-500">No content</div>
              )}
            </div>
          ))}
        </div>
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 2xl:gap-6 3xl:gap-8">
          {fantasyArticles?.slice(0, 4).map((article: FantasyArticle, index: number) => (
            <div key={article._id || index}>
              {article && article.slug?.current ? (
                <Link href={toFantasyUrl(article)} className="group">
                  <div className="space-y-3">
                    <div className="relative h-[200px] 2xl:h-[220px] 3xl:h-[250px] rounded-xl overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-500 hover:scale-[1.01] shadow-xl hover:shadow-2xl">
                      {article.coverImage?.asset ? (<Image src={urlFor(article.coverImage).width(800).height(600).fit('crop').url()} alt={article.title} fill className="object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.02]" sizes="(max-width:1024px) 50vw, 25vw" />) : (<div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800"><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className="w-16 h-16 mx-auto mb-3 bg-gray-600 rounded-full flex items-center justify-center"><svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div><p className="text-gray-400 text-xs font-medium">Fantasy Football</p></div></div></div>)}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
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

import { headers } from 'next/headers';
import { client } from '@/sanity/lib/client';
import { headlineQuery, headlinesByCategoryQuery, headlinesByTagQuery } from '@/sanity/lib/queries';
import type { HeadlineListItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import TagCloud from '../components/TagCloud';
import NewsletterSignup from '../components/NewsletterSignup';
import MostRead from '../components/MostRead';

// Server-rendered headlines index for stronger initial HTML
export const revalidate = 120; // allow caching but keep relatively fresh

function formatDate(date?: string) {
  if (!date || isNaN(new Date(date).getTime())) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function fetchHeadlines(params: URLSearchParams): Promise<HeadlineListItem[]> {
  const category = params.get('category');
  const tag = params.get('tag');
  const search = params.get('search');

  if (search) {
    return client.fetch(`
      *[(_type == "headline" || _type == "rankings") && published == true && (
        title match "*${search}*" ||
        summary match "*${search}*" ||
        category->title match "*${search}*" ||
        author->name match "*${search}*" ||
        rankingType match "*${search}*"
      )] | order(_createdAt desc, publishedAt desc) {
        _id,_type,title,homepageTitle,slug,summary,coverImage{asset->{url}},date,publishedAt,rankingType,author->{name},category->{title,slug,color},tags[]->{title}
      }
    `);
  }
  if (category) {
    return client.fetch(headlinesByCategoryQuery, { categorySlug: category });
  }
  if (tag) {
    return client.fetch(headlinesByTagQuery, { tagTitle: tag });
  }
  return client.fetch(headlineQuery);
}

function buildTitle(params: URLSearchParams) {
  const c = params.get('category');
  const t = params.get('tag');
  const s = params.get('search');
  if (s) return `Search Results for "${s}"`;
  if (c) return `${c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')} Headlines`;
  if (t) return `${t.charAt(0).toUpperCase() + t.slice(1)} Headlines`;
  return 'NFL Headlines';
}

function buildDescription(params: URLSearchParams) {
  const c = params.get('category');
  const t = params.get('tag');
  const s = params.get('search');
  if (s) return `Showing articles matching "${s}" from around the NFL.`;
  if (c) return `Latest news and analysis in ${c.replace('-', ' ')}.`;
  if (t) return `Articles tagged with ${t}.`;
  return 'Discover the latest NFL news, analysis, and breaking stories from around the league.';
}

export default async function HeadlinesPage() {
  const hdrs = await headers();
  const url = new URL(hdrs.get('x-url') || 'http://localhost');
  const params = url.searchParams;
  const [headlines] = await Promise.all([
    fetchHeadlines(params)
  ]);
  const title = buildTitle(params);
  const description = buildDescription(params);

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h1>
          <div className="w-24 h-1 bg-white mb-6" />
          <p className="text-xl text-gray-300 max-w-3xl leading-relaxed">{description}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {headlines.length === 0 ? (
              <p className="text-gray-400">No articles found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {headlines.slice(0,24).map(h => (
                  <article key={h._id} className="group rounded-lg overflow-hidden bg-[#0d0d0d] border border-[#1e1e1e] hover:bg-[#161616] hover:border-[#262626] transition-colors">
                    <Link href={h._type === 'rankings' ? `/rankings/${h.slug.current.trim()}` : `/headlines/${h.slug.current.trim()}`}>
                      {h.coverImage?.asset?.url && (
                        <div className="aspect-video relative overflow-hidden bg-[#111]">
                          <Image src={h.coverImage.asset.url} alt={h.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {h.category?.title && (
                            <span className="inline-block px-2 py-1 text-[11px] font-medium text-gray-300 bg-gray-800 rounded-md border border-gray-700/60">{h.category.title}</span>
                          )}
                          {h._type === 'rankings' && h.rankingType && (
                            <span className="inline-block px-2 py-1 text-[11px] font-medium text-gray-300 bg-gray-800 rounded-md border border-gray-700/60">{h.rankingType.replace('-', ' ').toUpperCase()} RANKINGS</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-white text-[15px] group-hover:text-gray-300 transition-colors mb-2 line-clamp-2">{h.homepageTitle || h.title}</h3>
                        {h.summary && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{h.summary}</p>}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          {h.author?.name && <span>By {h.author.name}</span>}
                          {h.date && <span>{formatDate(h.date)}</span>}
                        </div>
                        {Array.isArray(h.tags) && h.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {h.tags
                              // narrow structural type inline
                              .filter((t: { title?: string } | null): t is { title: string } => !!t && typeof t.title === 'string')
                              .slice(0,3)
                              .map((t, i) => (
                                <Link key={i} href={`/headlines?tag=${encodeURIComponent(t.title)}`} className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-white transition-colors">#{t.title}</Link>
                              ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg p-6">
              <TagCloud maxTags={15} />
            </div>
            <NewsletterSignup variant="sidebar" />
            <MostRead limit={6} />
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Subscribe via RSS</h3>
              <p className="text-sm text-gray-400 mb-4">Prefer feed readers? Follow our latest headlines instantly.</p>
              <a href="/rss.xml" className="inline-block text-sm px-3 py-2 rounded bg-white text-black font-medium hover:bg-gray-200 transition-colors">RSS Feed →</a>
            </div>
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Popular Categories</h3>
              <div className="space-y-2">
                <Link href="/headlines?category=nfl-draft" className="block text-gray-300 hover:text-white transition-colors">NFL Draft</Link>
                <Link href="/headlines?category=trade-rumors" className="block text-gray-300 hover:text-white transition-colors">Trade Rumors</Link>
                <Link href="/headlines?category=injury-report" className="block text-gray-300 hover:text-white transition-colors">Injury Report</Link>
                <Link href="/headlines?category=power-rankings" className="block text-gray-300 hover:text-white transition-colors">Power Rankings</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

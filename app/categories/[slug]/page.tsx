import { notFound } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import { categoryContentQuery, categoriesQuery } from '@/sanity/lib/queries';
import { Category } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import NewsletterSignup from '@/app/components/NewsletterSignup';
import { generateCategorySEOMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-config';

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

interface CategoryContentItem {
  _id: string;
  _type: 'article' | 'headline' | 'rankings' | 'fantasyFootball' | string;
  format?: string;
  rankingType?: string;
  seasonYear?: number;
  weekNumber?: number;
  playoffRound?: string;
  title: string;
  homepageTitle?: string;
  slug: { current: string };
  summary?: string;
  coverImage?: { asset?: { url?: string } };
  featuredImage?: { asset?: { url?: string } };
  image?: { asset?: { url?: string } };
  author?: { name?: string };
  category?: { title?: string; color?: string };
  date?: string;
  publishedAt?: string;
}

function getContentUrl(item: CategoryContentItem): string {
  const slug = item.slug?.current?.trim();
  if (!slug) return '#';
  if (item._type === 'headline') return `/headlines/${slug}`;
  if (item._type === 'rankings') return `/rankings/${slug}`;
  if (item._type === 'fantasyFootball') return `/fantasy/${slug}`;
  if (item._type === 'article' && item.format === 'powerRankings') {
    if (item.rankingType === 'snapshot' && item.seasonYear) {
      const weekPart = item.playoffRound
        ? item.playoffRound.toLowerCase()
        : typeof item.weekNumber === 'number'
          ? `week-${item.weekNumber}`
          : null;
      if (weekPart) return `/articles/power-rankings/${item.seasonYear}/${weekPart}`;
    }
    return '/articles/power-rankings';
  }
  return `/articles/${slug}`;
}

function getCardImage(item: CategoryContentItem): string | null {
  return item.coverImage?.asset?.url || item.featuredImage?.asset?.url || item.image?.asset?.url || null;
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  const params = await props.params;
  if (!params?.slug) return {};

  const categoriesData = await client.fetch<Category[]>(categoriesQuery);
  const category = categoriesData.find((cat: Category) => cat.slug.current === params.slug);

  if (!category) return {};

  return generateCategorySEOMetadata(category);
}

const PAGE_SIZE = 24;

export default async function CategoryPage(props: CategoryPageProps) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const categorySlug = params.slug;
  const requestedPage = Number.parseInt(searchParams?.page || '1', 10);

  const [items, categoriesData] = await Promise.all([
    client.fetch<CategoryContentItem[]>(categoryContentQuery, { categorySlug }),
    client.fetch<Category[]>(categoriesQuery)
  ]);

  const category = categoriesData.find((cat: Category) => cat.slug.current === categorySlug);

  if (!category) {
    notFound();
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageNumber = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const currentPage = Math.min(pageNumber, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageItems = items.slice(offset, offset + PAGE_SIZE);
  const previousPageHref = `/categories/${categorySlug}?page=${currentPage - 1}`;
  const nextPageHref = `/categories/${categorySlug}?page=${currentPage + 1}`;

  // Build JSON-LD ItemList for SEO
  const baseUrl = SITE_URL;
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.title} Articles`,
    itemListOrder: 'http://schema.org/ItemListOrderDescending',
    itemListElement: pageItems.map((h, idx) => ({
      '@type': 'ListItem',
      position: offset + idx + 1,
      url: `${baseUrl}${getContentUrl(h)}`,
      name: h.title
    }))
  };

  const getCategoryColorClasses = (color?: string) => {
    switch (color) {
      case 'red': return 'bg-red-600 border-red-600';
      case 'blue': return 'bg-white text-black border border-gray-300';
      case 'green': return 'bg-green-600 border-green-600';
      case 'yellow': return 'bg-yellow-600 border-yellow-600';
      case 'purple': return 'bg-purple-600 border-purple-600';
      case 'orange': return 'bg-orange-600 border-orange-600';
      default: return 'bg-gray-600 border-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return 'No date';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />
        {/* Category Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <span className={`px-4 py-2 rounded-full text-white font-medium ${getCategoryColorClasses(category.color)}`}>
              {category.title}
            </span>
            <span className="text-gray-400">
              {items.length} article{items.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {category.title}
          </h1>
          
          {category.description && (
            <p className="text-xl text-gray-300 max-w-3xl leading-relaxed">
              {category.description}
            </p>
          )}
          
          <div className="w-24 h-1 bg-white mt-6 mb-6"></div>
          {/* Cross-links */}
          <div className="flex flex-wrap gap-3 text-xs">
            <Link href="/categories" className="px-3 py-1 rounded-md bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">All Categories</Link>
            <Link href="/headlines" className="px-3 py-1 rounded-md bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">Latest Headlines</Link>
            <Link href="/articles/power-rankings" className="px-3 py-1 rounded-md bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">Power Rankings</Link>
            <Link href="/standings" className="px-3 py-1 rounded-md bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">Standings</Link>
            <Link href="/schedule" className="px-3 py-1 rounded-md bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">Schedule</Link>
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li className="text-gray-600">/</li>
            <li>
              <Link href="/categories" className="text-gray-400 hover:text-white transition-colors">
                Categories
              </Link>
            </li>
            <li className="text-gray-600">/</li>
            <li className="text-white">{category.title}</li>
          </ol>
        </nav>

        {/* Newsletter Signup */}
        <div className="mb-12">
          <NewsletterSignup />
        </div>

  {/* Headlines Grid (first page only – future: accept ?page= ) */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pageItems.map((item) => (
              <article key={item._id} className="group">
                <Link href={getContentUrl(item)}>
                  <div className="space-y-4">
                    {/* Image */}
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      {getCardImage(item) ? (
                        <Image
                          src={getCardImage(item) || ''}
                          alt={item.title}
                          width={400}
                          height={225}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      {/* Category Badge */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColorClasses(item.category?.color)}`}>
                          {item.category?.title || 'NFL'}
                        </span>
                        {(item.date || item.publishedAt) && (
                          <span className="text-xs text-gray-500">
                            {formatDate(item.date || item.publishedAt || '')}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-xl font-bold text-white group-hover:text-gray-300 transition-colors line-clamp-2">
                        {item.homepageTitle || item.title}
                      </h2>

                      {/* Summary intentionally hidden site-wide per design request */}

                      {/* Author */}
                      {item.author?.name && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>By {item.author.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">No articles found</h2>
            <p className="text-gray-400 mb-8">
              There are no articles in the {category.title} category yet.
            </p>
            <Link 
              href="/categories"
              className="inline-block px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Browse All Categories
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-3 text-sm">
            <Link
              href={previousPageHref}
              aria-disabled={currentPage <= 1}
              className={`rounded-md px-4 py-2 transition-colors ${
                currentPage <= 1
                  ? 'pointer-events-none bg-white/5 text-white/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Previous
            </Link>
            <span className="text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <Link
              href={nextPageHref}
              aria-disabled={currentPage >= totalPages}
              className={`rounded-md px-4 py-2 transition-colors ${
                currentPage >= totalPages
                  ? 'pointer-events-none bg-white/5 text-white/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Next
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

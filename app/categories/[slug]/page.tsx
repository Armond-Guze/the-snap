import { notFound } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import { headlinesByCategoryQuery, categoriesQuery } from '@/sanity/lib/queries';
import { HeadlineListItem, Category } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import NewsletterSignup from '@/app/components/NewsletterSignup';
import { generateCategorySEOMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
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
  const params = await props.params;
  const categorySlug = params.slug;

  const [headlines, categoriesData] = await Promise.all([
    client.fetch<HeadlineListItem[]>(headlinesByCategoryQuery, { categorySlug }),
    client.fetch<Category[]>(categoriesQuery)
  ]);

  const category = categoriesData.find((cat: Category) => cat.slug.current === categorySlug);

  if (!category) {
    notFound();
  }
  // Build JSON-LD ItemList for SEO
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamesnap.com';
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.title} Articles`,
    itemListOrder: 'http://schema.org/ItemListOrderDescending',
    itemListElement: headlines.slice(0, PAGE_SIZE).map((h, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${baseUrl}/headlines/${h.slug.current}`,
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
              {headlines.length} article{headlines.length !== 1 ? 's' : ''}
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
              <Link href="/headlines" className="text-gray-400 hover:text-white transition-colors">
                Headlines
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
        {headlines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {headlines.map((headline) => (
              <article key={headline._id} className="group">
                <Link href={`/headlines/${headline.slug.current}`}>
                  <div className="space-y-4">
                    {/* Image */}
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      {headline.coverImage?.asset?.url ? (
                        <Image
                          src={headline.coverImage.asset.url}
                          alt={headline.title}
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColorClasses(headline.category?.color)}`}>
                          {headline.category?.title || 'NFL'}
                        </span>
                        {headline.date && (
                          <span className="text-xs text-gray-500">
                            {formatDate(headline.date)}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-xl font-bold text-white group-hover:text-gray-300 transition-colors line-clamp-2">
                        {headline.title}
                      </h2>

                      {/* Summary intentionally hidden site-wide per design request */}

                      {/* Author */}
                      {headline.author && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>By {headline.author.name}</span>
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
              href="/headlines"
              className="inline-block px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Browse All Headlines
            </Link>
          </div>
        )}

        {/* Archive Link */}
        {headlines.length >= PAGE_SIZE && (
          <div className="text-center mt-12">
            <Link href="/headlines/page/2" className="px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors">
              View Older Articles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

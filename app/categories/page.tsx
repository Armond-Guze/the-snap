import { client } from '@/sanity/lib/client';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'NFL Categories – Topics & Coverage | The Snap',
  description: 'Browse NFL news categories: draft, trade rumors, injury reports, power rankings and more. Jump into focused hubs with the latest articles from The Snap.',
  alternates: { canonical: '/categories' },
  openGraph: {
    title: 'NFL Categories – The Snap',
    description: 'Explore topic hubs for every major NFL storyline and analysis area.',
    url: 'https://thegamesnap.com/categories',
    type: 'website'
  },
  robots: { index: true, follow: true }
};

interface CategoryLite { _id: string; title: string; slug: { current: string }; description?: string; color?: string; articleCount: number; topArticles: { title: string; slug: { current: string } }[] }

export default async function CategoriesIndexPage() {
  const categories: CategoryLite[] = await client.fetch(`*[_type=='category']|order(priority asc, title asc){
    _id,title,slug,description,color,
    "articleCount": count(*[_type=='headline' && published==true && category._ref == ^._id]),
    "topArticles": *[_type=='headline' && published==true && category._ref == ^._id]|order(_createdAt desc)[0...3]{title,slug}
  }`);

  return (
    <main className="min-h-screen bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">NFL Coverage Categories</h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Jump into focused topic hubs for deeper NFL analysis. Each category aggregates the latest headlines plus archives for long‑tail discovery.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/headlines" className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors">Latest Headlines</Link>
            <Link href="/power-rankings" className="px-4 py-2 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition-colors">Power Rankings</Link>
            <Link href="/standings" className="px-4 py-2 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition-colors">Standings</Link>
            <Link href="/schedule" className="px-4 py-2 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition-colors">Schedule</Link>
          </div>
        </header>
        {categories.length === 0 ? (
          <p className="text-gray-400">No categories created yet.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {categories.map(cat => (
              <div key={cat._id} className="rounded-lg border border-white/10 bg-[#0d0d0d] p-6 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold tracking-tight">{cat.title}</h2>
                  <span className="text-xs text-white/40">{cat.articleCount} article{cat.articleCount===1?'':'s'}</span>
                </div>
                {cat.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-3">{cat.description}</p>
                )}
                {cat.topArticles.length > 0 && (
                  <ul className="space-y-2 mb-4 text-sm">
                    {cat.topArticles.map(a => (
                      <li key={a.slug.current}>
                        <Link href={`/headlines/${a.slug.current}`} className="text-gray-300 hover:text-white transition-colors line-clamp-1">{a.title}</Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-2">
                  <Link href={`/categories/${cat.slug.current}`} className="inline-block text-xs uppercase tracking-wide font-semibold text-white/80 hover:text-white">Visit Hub →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

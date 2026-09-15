import { client } from '@/sanity/lib/client';
import { headlineQuery } from '@/sanity/lib/queries';
import Image from 'next/image';
import Link from 'next/link';
import type { HeadlineListItem } from '@/types';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-config';
import { notFound, permanentRedirect } from 'next/navigation';

export const revalidate = 120;

function parseArchivePage(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : null;
}

function archiveHref(page: number): string {
  return page === 1 ? '/headlines' : `/headlines/page/${page}`;
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  const pageNum = parseArchivePage(page);
  if (!pageNum) notFound();
  if (pageNum === 1) permanentRedirect('/headlines');

  const canonical = `${SITE_URL}${archiveHref(pageNum)}`;
  return {
    title: `NFL Headlines Archive – Page ${pageNum} | The Snap`,
    description: `Archive page ${pageNum} of NFL headlines, analysis and news articles from The Snap.`,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { title: `NFL Headlines Archive – Page ${pageNum}`, description: 'Browse older NFL headlines and analysis.', url: canonical }
  };
}

const PAGE_SIZE = 24;

function formatDate(date?: string) {
  if (!date || isNaN(new Date(date).getTime())) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function HeadlinesPaginatedPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const pageNum = parseArchivePage(page);
  if (!pageNum) notFound();
  if (pageNum === 1) permanentRedirect('/headlines');

  const start = (pageNum - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const [items, total] = await Promise.all([
    client.fetch<HeadlineListItem[]>(`${headlineQuery}[${start}...${end}]`),
    client.fetch<number>('count(' + headlineQuery.replace(/\s+/g, ' ') + ')'),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (pageNum > totalPages) notFound();

  return (
    <main className="min-h-screen bg-white text-neutral-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">NFL Headlines – Page {pageNum}</h1>
            <p className="text-neutral-500">Archive of NFL news & analysis. Page {pageNum} of {totalPages}.</p>
          </div>
          <Link href="/headlines" className="text-sm text-neutral-500 hover:text-neutral-900">Back to Latest</Link>
        </div>
        {items.length === 0 ? <p className="text-neutral-500">No articles.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(h => (
              <article key={h._id} className="group rounded-lg overflow-hidden bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors">
                <Link href={`/articles/${h.slug.current}`}>
                  {h.coverImage?.asset?.url && (
                    <div className="aspect-video relative overflow-hidden bg-[#111]">
                      <Image
                        src={h.coverImage.asset.url}
                        alt={h.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-neutral-900 text-[15px] group-hover:text-neutral-700 transition-colors mb-2 line-clamp-2">{h.homepageTitle || h.title}</h3>
                    {h.summary && <p className="text-neutral-500 text-sm mb-3 line-clamp-2">{h.summary}</p>}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {h.author?.name && <span>By {h.author.name}</span>}
                      {h.date && <span>{formatDate(h.date)}</span>}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
        <PaginationNav current={pageNum} total={totalPages} />
      </div>
    </main>
  );
}

function PaginationNav({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1).filter(p => (p === 1 || p === total || Math.abs(p - current) <= 2));
  return (
    <nav aria-label="Headline archive pagination" className="mt-10 flex items-center justify-center gap-2 text-sm">
      {current > 1 && <Link href={archiveHref(current - 1)} className="px-3 py-1 border border-neutral-200 rounded hover:bg-neutral-100">Prev</Link>}
      {pages.map(p => (
        <Link
          key={p}
          href={archiveHref(p)}
          aria-current={p === current ? 'page' : undefined}
          className={`px-3 py-1 rounded border ${p===current?'bg-neutral-900 text-white border-neutral-900':'border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
        >
          {p}
        </Link>
      ))}
      {current < total && <Link href={archiveHref(current + 1)} className="px-3 py-1 border border-neutral-200 rounded hover:bg-neutral-100">Next</Link>}
    </nav>
  );
}

export async function generateStaticParams() {
  // The canonical first page lives at /headlines; only seed archive pages that exist.
  const total = await client.fetch<number>('count(' + headlineQuery.replace(/\s+/g, ' ') + ')');
  const lastSeededPage = Math.min(3, Math.ceil(total / PAGE_SIZE));
  return Array.from({ length: Math.max(0, lastSeededPage - 1) }, (_, index) => ({
    page: String(index + 2),
  }));
}

import { NextResponse } from 'next/server';
import { SITE_BRAND, SITE_URL } from '@/lib/site-config';
import { client } from '@/sanity/lib/client';

export const dynamic = 'force-dynamic';

type NewsItem = {
  slug?: string;
  title?: string;
  publicationDate?: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const items = await client.fetch<NewsItem[]>(
    `*[
      published == true &&
      ((_type == "article" && format != "powerRankings") || _type == "headline") &&
      coalesce(date, publishedAt, _createdAt) >= $since &&
      defined(slug.current)
    ] | order(coalesce(date, publishedAt, _createdAt) desc)[0...1000]{
      "slug": slug.current,
      title,
      "publicationDate": coalesce(date, publishedAt, _createdAt)
    }`,
    { since }
  );

  const urls = items
    .filter((item): item is Required<NewsItem> => Boolean(item.slug && item.title && item.publicationDate))
    .map((item) => `
  <url>
    <loc>${escapeXml(`${SITE_URL}/articles/${item.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_BRAND)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(item.publicationDate)}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
    </news:news>
  </url>`)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

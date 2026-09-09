import { client } from '@/sanity/lib/client';
import { SITE_URL } from '@/lib/site-config';

// Revalidate every 10 minutes
export const revalidate = 600;

interface FeedItem {
  _id: string;
  title: string;
  homepageTitle?: string;
  slug?: { current?: string };
  summary?: string;
  date?: string;
  _createdAt: string;
  _updatedAt?: string;
  category?: { title?: string };
}

function stripInvalidXmlCharacters(value: string): string {
  return Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0) || 0;
      return (
        codePoint === 0x09 ||
        codePoint === 0x0a ||
        codePoint === 0x0d ||
        (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
        (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
        (codePoint >= 0x10000 && codePoint <= 0x10ffff)
      );
    })
    .join('');
}

function escapeXml(value?: string): string {
  return stripInvalidXmlCharacters(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toCdata(value?: string): string {
  return stripInvalidXmlCharacters(value || '').replace(/]]>/g, ']]]]><![CDATA[>');
}

function toRssDate(value?: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toUTCString();
}

function articleUrl(slug: string): string | null {
  const encodedSlug = slug
    .trim()
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  if (!encodedSlug) return null;
  return new URL(`/articles/${encodedSlug}`, `${SITE_URL}/`).toString();
}

export async function GET() {
  const items: FeedItem[] = await client.fetch(`
    *[
      ((_type == "article" && format == "headline") || _type == "headline") && published == true
    ]
      | order(date desc, _createdAt desc)[0...50] {
        _id,
        title,
        homepageTitle,
        slug,
        summary,
        date,
        _createdAt,
        _updatedAt,
        category->{title}
      }
  `);

  const validUpdatedDates = items
    .map((item) => new Date(item.date || item._updatedAt || item._createdAt).getTime())
    .filter(Number.isFinite);
  const newestTimestamp = validUpdatedDates.length > 0 ? Math.max(...validUpdatedDates) : Date.now();
  const lastBuildDate = new Date(newestTimestamp).toUTCString();

  const rssItems = items.flatMap((item) => {
    const slug = item.slug?.current?.trim();
    const title = (item.homepageTitle || item.title || '').trim();
    const published = toRssDate(item.date || item._createdAt);
    if (!slug || !title || !published) return [];

    const url = articleUrl(slug);
    if (!url) return [];
    return [
      `\n    <item>\n      <title>${escapeXml(title)}</title>\n      <link>${escapeXml(url)}</link>\n      <guid isPermaLink="true">${escapeXml(url)}</guid>\n      <pubDate>${published}</pubDate>\n      ${item.category?.title ? `<category>${escapeXml(item.category.title)}</category>` : ''}\n      <description><![CDATA[${toCdata(item.summary)}]]></description>\n    </item>`,
    ];
  }).join('');

  const rssUrl = new URL('/rss.xml', `${SITE_URL}/`).toString();
  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>The Snap – NFL Headlines &amp; Analysis</title>\n    <link>${escapeXml(SITE_URL)}</link>\n    <atom:link href="${escapeXml(rssUrl)}" rel="self" type="application/rss+xml" />\n    <description>Latest NFL news, power rankings, standings insights and schedule analysis from The Snap.</description>\n    <language>en-us</language>\n    <lastBuildDate>${lastBuildDate}</lastBuildDate>${rssItems}\n  </channel>\n</rss>`;

  return new Response(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=UTF-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300'
    }
  });
}

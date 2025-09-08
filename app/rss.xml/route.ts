import { client } from '@/sanity/lib/client';

// Revalidate every 10 minutes
export const revalidate = 600;

interface FeedItem {
  _id: string;
  title: string;
  homepageTitle?: string;
  slug: { current: string };
  summary?: string;
  date?: string;
  _createdAt: string;
  _updatedAt?: string;
  category?: { title?: string };
}

export async function GET() {
  // Pull latest 50 published headline documents (and rankings if treated similarly)
  const items: FeedItem[] = await client.fetch(`*[_type == "headline" && published == true] | order(date desc, _createdAt desc)[0...50]{
    _id,title,homepageTitle,slug,summary,date,_createdAt,_updatedAt,category->{title}
  }`);

  const siteUrl = 'https://thegamesnap.com';
  const updated = items[0]?.date || items[0]?._updatedAt || new Date().toISOString();

  const escape = (s?: string) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const rssItems = items.map(item => {
    const url = `${siteUrl}/headlines/${item.slug.current}`;
    const published = item.date || item._createdAt;
  const title = escape(item.homepageTitle || item.title);
    return `\n    <item>\n      <title>${title}</title>\n      <link>${url}</link>\n      <guid isPermaLink="true">${url}</guid>\n      <pubDate>${new Date(published).toUTCString()}</pubDate>\n      ${item.category?.title ? `<category>${escape(item.category.title)}</category>` : ''}\n      <description><![CDATA[${item.summary || ''}]]></description>\n    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>The Snap – NFL Headlines & Analysis</title>\n    <link>${siteUrl}</link>\n    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />\n    <description>Latest NFL news, power rankings, standings insights and schedule analysis from The Snap.</description>\n    <language>en-us</language>\n    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>${rssItems}\n  </channel>\n</rss>`;

  return new Response(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=UTF-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300'
    }
  });
}

import { NextRequest } from 'next/server';
import { client } from '@/sanity/lib/client';

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedLimit = Number(searchParams.get('limit'));
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 20)
    : 6;
  const data = await client.fetch(`
    *[
      published == true && (
        _type == "headline" || (_type == "article" && format == "headline")
      )
    ]
      | order(coalesce(date, publishedAt, _createdAt) desc, _createdAt desc)[0...${limit}] {
        _id,
        _type,
        title,
        homepageTitle,
        slug,
        format,
        date,
        publishedAt
      }
  `);
  return Response.json({ items: data }, {
    status: 200,
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=120' }
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 120);
  const words = query.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').trim();
  if (words.length < 2) return NextResponse.json({ results: [] });

  try {
    const results = await client.fetch(`*[
      _type in ["article", "headline", "rankings", "fantasyFootball"] &&
      published == true && !(_id in path("drafts.**")) && defined(slug.current) &&
      (title match $pattern || homepageTitle match $pattern || summary match $pattern || category->title match $pattern)
    ] | order(coalesce(date, publishedAt, _createdAt) desc)[0...10]{
      _id, _type, title, homepageTitle, "slug": slug.current, format,
      seasonYear, weekNumber, playoffRound, rankingType,
      "image": coalesce(coverImage.asset->url, featuredImage.asset->url, image.asset->url),
      "category": category->title
    }`, { pattern: `*${words}*` }, { next: { revalidate: 60 } });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Search is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}

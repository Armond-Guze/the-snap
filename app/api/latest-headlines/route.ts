import { NextRequest } from 'next/server';
import { client } from '@/sanity/lib/client';

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 6, 20);
  const data = await client.fetch(`*[_type == "headline" && published == true] | order(_createdAt desc)[0...${limit}] { _id,title,slug }`);
  return new Response(JSON.stringify({ items: data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=300, stale-while-revalidate=120' }
  });
}

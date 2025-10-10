import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';

// Minimal webhook handler to revalidate standings cache tag
export async function POST(req: NextRequest) {
  try {
    // Optional: verify secret if configured
    const secret = process.env.SANITY_STANDINGS_REVALIDATE_SECRET;
    if (secret) {
      const url = new URL(req.url);
      const token = url.searchParams.get('secret');
      if (token !== secret) {
        return new Response(JSON.stringify({ revalidated: false, message: 'Invalid secret' }), { status: 401 });
      }
    }

    revalidateTag('standings');
    return new Response(JSON.stringify({ revalidated: true, tag: 'standings' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ revalidated: false, error: (err as Error).message }), { status: 500 });
  }
}

export const revalidate = 0;
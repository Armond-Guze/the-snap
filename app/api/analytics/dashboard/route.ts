import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

// Admin IP addresses that can access this endpoint
const ADMIN_IPS = [
  'localhost',
  '127.0.0.1',
  '192.168.',
  '10.',
  // Add your specific IP addresses here
];

function isAdminRequest(request: NextRequest): boolean {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '';
  
  // Allow in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  return ADMIN_IPS.some(adminIp => ip.includes(adminIp));
}

export async function GET(request: NextRequest) {
  try {
    // Check if admin
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'headlines', 'rankings', or 'all'
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = '';
    const params = { limit };

    switch (type) {
      case 'headlines':
        query = `
          *[_type == "headline" && published == true] | order(viewCount desc, _createdAt desc)[0...$limit] {
            _id,
            title,
            slug,
            viewCount,
            date,
            author->{ name },
            category->{ title }
          }
        `;
        break;
      case 'rankings':
        query = `
          *[_type == "rankings" && published == true] | order(viewCount desc, publishedAt desc)[0...$limit] {
            _id,
            title,
            slug,
            rankingType,
            viewCount,
            publishedAt,
            author->{ name }
          }
        `;
        break;
      default:
        // Get both types
        const [headlines, rankings] = await Promise.all([
          client.fetch(`
            *[_type == "headline" && published == true] | order(viewCount desc, _createdAt desc)[0...10] {
              _id,
              _type,
              title,
              slug,
              viewCount,
              date,
              author->{ name },
              category->{ title }
            }
          `),
          client.fetch(`
            *[_type == "rankings" && published == true] | order(viewCount desc, publishedAt desc)[0...10] {
              _id,
              _type,
              title,
              slug,
              rankingType,
              viewCount,
              publishedAt,
              author->{ name }
            }
          `)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            headlines,
            rankings,
            totalHeadlines: headlines.length,
            totalRankings: rankings.length,
            totalViews: [...headlines, ...rankings].reduce((sum, item) => sum + (item.viewCount || 0), 0)
          }
        });
    }

    const data = await client.fetch(query, params);

    return NextResponse.json({
      success: true,
      data,
      type,
      count: data.length
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Article Click Tracked:', {
        timestamp: data.timestamp,
        article: data.articleTitle,
        slug: data.articleSlug,
        category: data.category,
        author: data.author,
        position: data.position,
        source: data.source,
        userAgent: data.userAgent,
        url: data.url,
        referrer: data.referrer
      });
    }

    // Here you could save to your database
    // await saveClickData(data);
    
    // Or send to external analytics service
    // await sendToAnalyticsService(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { appendEvent } from '../../../../lib/analytics-store';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    await appendEvent({
      type: 'article_click',
      articleId: data.articleId,
      articleSlug: data.articleSlug,
      articleTitle: data.articleTitle,
      category: data.category,
      author: data.author,
      readingTime: data.readingTime,
      timestamp: data.timestamp || new Date().toISOString(),
      source: data.source,
      position: data.position
    } as any); // retained any due to dynamic shape; can refine later

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}

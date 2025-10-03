import { NextRequest, NextResponse } from 'next/server';
import { appendEvent } from '../../../../lib/analytics-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      articleId, 
      articleTitle, 
      slug, 
      category, 
      author, 
      readingTime,
      timestamp = new Date().toISOString()
    } = body;

    // Validate required fields
    if (!articleId || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: articleId and slug' },
        { status: 400 }
      );
    }

    // Persist minimal event (file-based). Omits IP for privacy.
    await appendEvent({
      type: 'article_view',
      articleId,
      articleSlug: slug,
      articleTitle,
      category,
      author,
      readingTime,
      timestamp
    });

    // In a real implementation, you might:
    // 1. Save to a database (PostgreSQL, MongoDB, etc.)
    // 2. Send to an analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Update view counts in your CMS (Sanity)
    // 4. Queue for batch processing

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking article view:', error);
    return NextResponse.json(
      { error: 'Failed to track article view' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Article view tracking endpoint',
    methods: ['POST']
  });
}
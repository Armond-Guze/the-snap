import { NextRequest, NextResponse } from 'next/server';
import { appendEvent, type ArticleClickEvent } from '../../../../lib/analytics-store';

type ArticleClickRequestBody = Omit<ArticleClickEvent, 'type' | 'timestamp'> & {
  timestamp?: string;
  isOwner?: boolean;
};

function isExcludedRequest(request: NextRequest, body?: { isOwner?: boolean }) {
  const cookieExcluded = request.cookies.get('va-exclude')?.value === '1';
  return cookieExcluded || body?.isOwner === true;
}

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as ArticleClickRequestBody;

    if (isExcludedRequest(request, data)) {
      return NextResponse.json({ success: true, skipped: 'excluded_visitor' });
    }

    if (!data.articleId || !data.articleSlug) {
      return NextResponse.json({ error: 'Missing article analytics identifiers' }, { status: 400 });
    }

    const event: ArticleClickEvent = {
      type: 'article_click',
      articleId: data.articleId,
      articleSlug: data.articleSlug,
      articleTitle: data.articleTitle,
      category: data.category,
      author: data.author,
      readingTime: data.readingTime,
      timestamp: data.timestamp || new Date().toISOString(),
      source: data.source,
      position: data.position,
    };
    
    await appendEvent(event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}

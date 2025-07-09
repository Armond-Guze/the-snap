import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';

// Admin IP addresses or user agents that should be excluded from view counting
const ADMIN_EXCLUSIONS = [
  'localhost',
  '127.0.0.1',
  '192.168.',
  '10.',
  // Add your specific IP addresses here
  // '123.456.789.0', // Your home IP
];

// Function to check if the request is from an admin/owner
function isAdminRequest(request: NextRequest): boolean {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '';
  
  // Check if it's from development environment
  if (process.env.NODE_ENV === 'development') {
    return true; // Don't count views in development
  }
  
  // Check IP exclusions
  return ADMIN_EXCLUSIONS.some(exclusion => ip.includes(exclusion));
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { articleId, articleSlug, articleType = 'headline' } = data;
    
    if (!articleId && !articleSlug) {
      return NextResponse.json({ error: 'Article ID or slug required' }, { status: 400 });
    }
    
    // Check if this is an admin request
    const isAdmin = isAdminRequest(request);
    
    // Log the view
    if (process.env.NODE_ENV === 'development') {
      console.log('Article View Tracked:', {
        timestamp: new Date().toISOString(),
        articleId,
        articleSlug,
        articleType,
        isAdmin,
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        url: data.url,
        referrer: data.referrer
      });
    }
    
    // Only increment view count if not admin
    if (!isAdmin) {
      try {
        // Find the article and increment view count
        const query = articleId 
          ? `*[_type == "${articleType}" && _id == $articleId][0]`
          : `*[_type == "${articleType}" && slug.current == $articleSlug][0]`;
          
        const params = articleId ? { articleId } : { articleSlug };
        
        const article = await client.fetch(query, params);
        
        if (article) {
          // Increment view count using Sanity's patch API
          await client
            .patch(article._id)
            .setIfMissing({ viewCount: 0 })
            .inc({ viewCount: 1 })
            .commit();
            
          console.log(`View count incremented for ${articleType}: ${article.title}`);
        }
      } catch (sanityError) {
        console.error('Error updating view count in Sanity:', sanityError);
        // Don't fail the entire request if Sanity update fails
      }
    }
    
    // Return whether this was counted as a view
    return NextResponse.json({ 
      success: true, 
      counted: !isAdmin,
      isAdmin 
    });
    
  } catch (error) {
    console.error('Article view tracking error:', error);
    return NextResponse.json({ error: 'View tracking failed' }, { status: 500 });
  }
}

// GET endpoint to retrieve view counts for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    const articleSlug = searchParams.get('articleSlug');
    const articleType = searchParams.get('articleType') || 'headline';
    
    if (!articleId && !articleSlug) {
      return NextResponse.json({ error: 'Article ID or slug required' }, { status: 400 });
    }
    
    // Check if this is an admin request (you might want to add proper auth here)
    const isAdmin = isAdminRequest(request);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const query = articleId 
      ? `*[_type == "${articleType}" && _id == $articleId][0]{ _id, title, viewCount }`
      : `*[_type == "${articleType}" && slug.current == $articleSlug][0]{ _id, title, viewCount }`;
      
    const params = articleId ? { articleId } : { articleSlug };
    
    const article = await client.fetch(query, params);
    
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      article: {
        id: article._id,
        title: article.title,
        viewCount: article.viewCount || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching view count:', error);
    return NextResponse.json({ error: 'Failed to fetch view count' }, { status: 500 });
  }
}

import { describe, expect, it } from 'vitest';
import { createWebsitePageMetadata, resolveCanonicalUrl } from '@/lib/seo';

describe('SEO metadata helpers', () => {
  it('keeps canonical, Open Graph, and Twitter metadata on the same page URL', () => {
    const canonicalUrl = 'https://thegamesnap.com/editorial-standards';
    const metadata = createWebsitePageMetadata({
      title: 'Editorial Standards | The Snap',
      description: 'How The Snap reviews its NFL coverage.',
      canonicalUrl,
    });

    expect(metadata.alternates?.canonical).toBe(canonicalUrl);
    expect(metadata.openGraph).toMatchObject({ url: canonicalUrl, type: 'website' });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('honors an editorial custom canonical across metadata consumers', () => {
    const canonicalUrl = resolveCanonicalUrl(
      {
        slug: { current: 'duplicate-story' },
        seo: { canonicalUrl: 'https://thegamesnap.com/articles/original-story' },
      },
      '/articles',
      'https://thegamesnap.com/'
    );

    expect(canonicalUrl).toBe('https://thegamesnap.com/articles/original-story');
  });

  it('normalizes the generated self-canonical path when no override exists', () => {
    const canonicalUrl = resolveCanonicalUrl(
      { slug: { current: '/clean-story/' } },
      '/articles/',
      'https://thegamesnap.com/'
    );

    expect(canonicalUrl).toBe('https://thegamesnap.com/articles/clean-story');
  });
});

import type { ImgHTMLAttributes, ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sanityFetch } = vi.hoisted(() => ({
  sanityFetch: vi.fn(),
}));

vi.mock('@/sanity/lib/fetch', () => ({ sanityFetch }));

vi.mock('next/image', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    default: ({ fill, ...props }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
      void fill;
      return React.createElement('img', props);
    },
  };
});

import Headlines from '@/app/components/Headlines';
import RankingsSection from '@/app/components/RankingsSection';

const leadImageSizes =
  '(max-width: 1023px) calc(100vw - 2rem), (min-width: 1536px) 52vw, (min-width: 1280px) 57vw, 52vw';

describe('homepage image loading', () => {
  beforeEach(() => {
    sanityFetch.mockReset();
  });

  it('gives the responsive copies of the lead story one eager high-priority request', async () => {
    sanityFetch.mockResolvedValue([
      {
        _id: 'lead',
        _type: 'article',
        title: 'Lead story',
        slug: { current: 'lead-story' },
        coverImage: { asset: { url: 'https://cdn.sanity.io/lead.webp' } },
      },
    ]);

    const tree = await Headlines({ hideSummaries: true });
    const html = renderToStaticMarkup(tree as ReactElement);

    expect(html.match(/<img/g)).toHaveLength(2);
    expect(html.match(/loading="eager"/g)).toHaveLength(2);
    expect(html.match(/fetchPriority="high"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html.match(new RegExp(`sizes="${leadImageSizes.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'))).toHaveLength(2);
  });

  it('keeps below-fold article cards lazy and reports their mobile rendered width', async () => {
    sanityFetch.mockResolvedValue([
      {
        _id: 'article',
        _type: 'article',
        format: 'analysis',
        title: 'Analysis story',
        slug: { current: 'analysis-story' },
        coverImage: { asset: { url: 'https://cdn.sanity.io/analysis.webp' } },
      },
    ]);

    const tree = await RankingsSection({ hideSummaries: true });
    const html = renderToStaticMarkup(tree as ReactElement);

    expect(html).not.toContain('loading="eager"');
    expect(html).not.toContain('fetchPriority="high"');
    expect(html).toContain(
      'sizes="(min-width:1536px) 30vw, (min-width:1280px) 33vw, (min-width:640px) 50vw, calc(100vw - 3rem)"',
    );
  });
});

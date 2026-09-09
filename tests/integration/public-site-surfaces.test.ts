import { beforeEach, describe, expect, it, vi } from 'vitest';
import nextConfig from '../../next.config';

const { sanityFetch } = vi.hoisted(() => ({
  sanityFetch: vi.fn(),
}));

vi.mock('@/sanity/lib/client', () => ({
  client: { fetch: sanityFetch },
}));

import { GET as getRss } from '@/app/rss.xml/route';
import robots from '@/app/robots';

describe('public site configuration', () => {
  beforeEach(() => {
    sanityFetch.mockReset();
  });

  it('keeps the Studio CSP override after the public catch-all rule', async () => {
    expect(typeof nextConfig.headers).toBe('function');
    const rules = await nextConfig.headers!();
    const publicRule = rules.find((rule) => rule.source === '/:path*');
    const studioRule = rules.find((rule) => rule.source === '/studio/:path*');
    const publicCsp = publicRule?.headers.find((header) => header.key === 'Content-Security-Policy')?.value;
    const studioCsp = studioRule?.headers.find((header) => header.key === 'Content-Security-Policy')?.value;

    expect(rules.at(-1)?.source).toBe('/studio/:path*');
    expect(publicCsp).toContain('https://formspree.io');
    expect(publicCsp).toContain('https://www.youtube.com');
    expect(publicCsp).not.toContain("'unsafe-eval'");
    expect(studioCsp).toContain("'unsafe-eval'");
  });

  it('permanently redirects the retired article URL', async () => {
    expect(typeof nextConfig.redirects).toBe('function');
    const redirects = await nextConfig.redirects!();

    expect(redirects).toContainEqual({
      source: '/articles/cowboys-charles-snowden-suspended-for-first-three-regular-season-games-nfl-com-roundup',
      destination: '/teams/dallas-cowboys',
      permanent: true,
    });
  });

  it('allows crawlers to fetch generated OG images while keeping other APIs blocked', () => {
    const generated = robots();
    const rules = Array.isArray(generated.rules) ? generated.rules : [generated.rules];
    const publicRule = rules.find((rule) => rule.userAgent === '*');

    expect(publicRule?.allow).toContain('/api/og');
    expect(publicRule?.disallow).toContain('/api/');
  });

  it('emits escaped, parse-safe RSS text for titles and categories', async () => {
    sanityFetch.mockResolvedValue([
      {
        _id: 'article-1',
        title: 'Cowboys & Giants <Notes>',
        slug: { current: 'cowboys-giants-notes' },
        summary: 'One ]]> two',
        date: '2026-08-09T12:00:00.000Z',
        _createdAt: '2026-08-09T12:00:00.000Z',
        category: { title: 'News & Analysis' },
      },
    ]);

    const response = await getRss();
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/rss+xml');
    expect(xml).toContain('NFL Headlines &amp; Analysis');
    expect(xml).toContain('<title>Cowboys &amp; Giants &lt;Notes&gt;</title>');
    expect(xml).toContain('<category>News &amp; Analysis</category>');
    expect(xml).toContain(']]]]><![CDATA[>');
  });
});

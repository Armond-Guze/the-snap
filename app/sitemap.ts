import { MetadataRoute } from 'next'
import { client } from '../sanity/lib/client'
import { loadStaticSchedule } from '@/lib/schedule'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamesnap.com'

// Use a stable timestamp for static routes so the sitemap XML doesn't churn daily.
// You can override by setting SITEMAP_STATIC_LASTMOD env var (ISO date string).
const STATIC_LAST_MOD = process.env.SITEMAP_STATIC_LASTMOD
  ? new Date(process.env.SITEMAP_STATIC_LASTMOD)
  : new Date('2025-08-01T00:00:00.000Z')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [headlines, rankings, fantasy, categories, staticSchedule] = await Promise.all([
    client.fetch<{slug: {current: string}, _updatedAt: string}[]>(`*[_type == "headline" && published == true]{ slug, _updatedAt }`),
    client.fetch<{slug: {current: string}, _updatedAt: string}[]>(`*[_type == "rankings" && published == true]{ slug, _updatedAt }`),
    client.fetch<{slug: {current: string}, _updatedAt: string}[]>(`*[_type == "fantasyFootball" && published == true]{ slug, _updatedAt }`),
    client.fetch<{slug: {current: string}, _updatedAt: string}[]>(`*[_type == "category"]{ slug, _updatedAt }`),
    loadStaticSchedule(),
  ]);

  // Latest update time for standings page from teamRecord documents
  const latestTeamRecordUpdatedAt = await client.fetch<string | null>(
    `*[_type == "teamRecord" && defined(_updatedAt)] | order(_updatedAt desc)[0]._updatedAt`
  );
  const standingsLastMod = latestTeamRecordUpdatedAt ? new Date(latestTeamRecordUpdatedAt) : undefined;

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...headlines.map(h => ({
      url: `${baseUrl}/headlines/${h.slug?.current}`,
      lastModified: h._updatedAt ? new Date(h._updatedAt) : STATIC_LAST_MOD,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...rankings.map(r => ({
      url: `${baseUrl}/rankings/${r.slug?.current}`,
      lastModified: r._updatedAt ? new Date(r._updatedAt) : STATIC_LAST_MOD,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...fantasy.map(f => ({
      url: `${baseUrl}/fantasy/${f.slug?.current}`,
      lastModified: f._updatedAt ? new Date(f._updatedAt) : STATIC_LAST_MOD,
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    })),
    ...categories.map(c => ({
      url: `${baseUrl}/categories/${c.slug?.current}`,
      lastModified: c._updatedAt ? new Date(c._updatedAt) : STATIC_LAST_MOD,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ];

  // Power Rankings weekly snapshots
  const rankingWeekSlugs: { slug?: { current?: string } | null; _updatedAt?: string }[] = await client.fetch(`*[_type=="powerRankingWeek"]{ slug, _updatedAt }`);
  const rankingWeekEntries: MetadataRoute.Sitemap = rankingWeekSlugs
    .map((s) => {
      const slug = s?.slug?.current || '';
      const short = slug.replace('week-','');
      return {
        url: `${baseUrl}/power-rankings/week/${short}`,
        lastModified: s._updatedAt ? new Date(s._updatedAt) : STATIC_LAST_MOD,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      } satisfies MetadataRoute.Sitemap[number];
    });

  const gameCenterEntries: MetadataRoute.Sitemap = staticSchedule.map((game) => ({
    url: `${baseUrl}/game-center/${game.gameId}`,
    lastModified: new Date(game.dateUTC),
    changeFrequency: 'hourly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'weekly',
      priority: 0.55,
    },
    {
      url: `${baseUrl}/headlines`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/power-rankings`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/standings`,
      lastModified: standingsLastMod || STATIC_LAST_MOD,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/schedule`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/newsletter`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    ...dynamicEntries,
    ...rankingWeekEntries,
    ...gameCenterEntries,
    // Pre-render schedule week pages (1-18)
    ...Array.from({ length: 18 }, (_, i) => ({
      url: `${baseUrl}/schedule/week/${i + 1}`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'weekly' as const,
      priority: 0.55,
    })),
  ]
}

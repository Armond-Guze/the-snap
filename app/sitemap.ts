import { MetadataRoute } from 'next'
import { client } from '../sanity/lib/client'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamesnap.com'

// Use a stable timestamp for static routes so the sitemap XML doesn't churn daily.
// You can override by setting SITEMAP_STATIC_LASTMOD env var (ISO date string).
// Default is a recent, fixed date to avoid future-dated entries.
const STATIC_LAST_MOD = process.env.SITEMAP_STATIC_LASTMOD
  ? new Date(process.env.SITEMAP_STATIC_LASTMOD)
  : new Date('2025-01-01T00:00:00.000Z')

// Ensure we never emit invalid sitemap URLs (spaces, punctuation)
const safeSlug = (slug?: string | null) => {
  if (!slug) return null;
  const trimmed = slug.trim();
  if (!trimmed) return null;
  // encodeURI keeps slashes; encodeURIComponent would encode slashes too. We only expect single-segment slugs here.
  return encodeURIComponent(trimmed.toLowerCase());
};

const dedupeEntries = (entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap => {
  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of entries) {
    if (!entry.url) continue;
    if (byUrl.has(entry.url)) continue;
    byUrl.set(entry.url, entry);
  }
  return Array.from(byUrl.values());
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [headlines, articles, fantasy, categories] = await Promise.all([
    client.fetch<{slug: {current: string}, _updatedAt: string}[]>(`*[((_type == "article" && format == "headline") || _type == "headline") && published == true]{ slug, _updatedAt }`),
    client.fetch<{slug: {current: string}, _updatedAt: string}[]>(`*[_type == "rankings" && published == true]{ slug, _updatedAt }`),
    client.fetch<{slug: {current: string}, _updatedAt: string}[]>(`*[_type == "fantasyFootball" && published == true]{ slug, _updatedAt }`),
    client.fetch<{slug: {current: string}, _updatedAt: string}[]>(`*[_type == "category"]{ slug, _updatedAt }`),
  ]);

  // Latest update time for standings page from teamRecord documents
  const latestTeamRecordUpdatedAt = await client.fetch<string | null>(
    `*[_type == "teamRecord" && defined(_updatedAt)] | order(_updatedAt desc)[0]._updatedAt`
  );
  const standingsLastMod = latestTeamRecordUpdatedAt ? new Date(latestTeamRecordUpdatedAt) : undefined;

  const dynamicEntries: MetadataRoute.Sitemap = dedupeEntries([
    // Detail pages: always point to final articles path to avoid sitemap URLs that redirect
    ...headlines
      .map(h => {
        const slug = safeSlug(h.slug?.current);
        if (!slug) return null;
        return {
          url: `${baseUrl}/articles/${slug}`,
          lastModified: h._updatedAt ? new Date(h._updatedAt) : STATIC_LAST_MOD,
          changeFrequency: 'daily' as const,
          priority: 0.7,
        } satisfies MetadataRoute.Sitemap[number];
      })
      .filter(Boolean) as MetadataRoute.Sitemap,
    ...articles
      .map(r => {
        const slug = safeSlug(r.slug?.current);
        if (!slug) return null;
        return {
          url: `${baseUrl}/articles/${slug}`,
          lastModified: r._updatedAt ? new Date(r._updatedAt) : STATIC_LAST_MOD,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        } satisfies MetadataRoute.Sitemap[number];
      })
      .filter(Boolean) as MetadataRoute.Sitemap,
    ...fantasy
      .map(f => {
        const slug = safeSlug(f.slug?.current);
        if (!slug) return null;
        return {
          url: `${baseUrl}/fantasy/${slug}`,
          lastModified: f._updatedAt ? new Date(f._updatedAt) : STATIC_LAST_MOD,
          changeFrequency: 'weekly' as const,
          priority: 0.65,
        } satisfies MetadataRoute.Sitemap[number];
      })
      .filter(Boolean) as MetadataRoute.Sitemap,
    ...categories
      .map(c => {
        const slug = safeSlug(c.slug?.current);
        if (!slug) return null;
        return {
          url: `${baseUrl}/categories/${slug}`,
          lastModified: c._updatedAt ? new Date(c._updatedAt) : STATIC_LAST_MOD,
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        } satisfies MetadataRoute.Sitemap[number];
      })
      .filter(Boolean) as MetadataRoute.Sitemap,
  ]);

  // Power Rankings weekly snapshots
  const rankingWeekDocs: { seasonYear?: number; weekNumber?: number; playoffRound?: string; _updatedAt?: string }[] =
    await client.fetch(`*[_type=="article" && format=="powerRankings" && rankingType=="snapshot" && published==true]{ seasonYear, weekNumber, playoffRound, _updatedAt }`);
  const rankingWeekEntries: MetadataRoute.Sitemap = dedupeEntries(
    rankingWeekDocs
      .map((s) => {
        if (!s?.seasonYear) return null;
        const weekPart = typeof s.weekNumber === 'number' ? `week-${s.weekNumber}` : s.playoffRound?.toLowerCase();
        if (!weekPart) return null;
        return {
          url: `${baseUrl}/power-rankings/${s.seasonYear}/${weekPart}`,
          lastModified: s._updatedAt ? new Date(s._updatedAt) : STATIC_LAST_MOD,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        } satisfies MetadataRoute.Sitemap[number];
      })
      .filter(Boolean) as MetadataRoute.Sitemap
  );

  return dedupeEntries([
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
      url: `${baseUrl}/articles`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'daily',
      priority: 0.8,
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
    // Pre-render schedule week pages (1-18)
    ...Array.from({ length: 18 }, (_, i) => ({
      url: `${baseUrl}/schedule/week/${i + 1}`,
      lastModified: STATIC_LAST_MOD,
      changeFrequency: 'weekly' as const,
      priority: 0.55,
    })),
  ])
}

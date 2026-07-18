import { MetadataRoute } from 'next'
import { client } from '../sanity/lib/client'
import { SITE_URL } from '@/lib/site-config'
import { TEAM_ABBRS, TEAM_META } from '@/lib/schedule'

const baseUrl = SITE_URL

type SitemappedDocument = {
  slug: { current: string }
  lastModified?: string
}

const toValidDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

// Ensure we never emit invalid sitemap URLs (spaces, punctuation)
const safeSlug = (slug?: string | null) => {
  if (!slug) return null;
  const trimmed = slug.trim();
  if (!trimmed) return null;
  // encodeURI keeps slashes; encodeURIComponent would encode slashes too. We only expect single-segment slugs here.
  return encodeURIComponent(trimmed.toLowerCase());
};

const teamSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

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
  const [articles, fantasy, categories, topicHubs] = await Promise.all([
    client.fetch<SitemappedDocument[]>(
      `*[
        (_type in ["article","headline","rankings"]) &&
        published == true &&
        !(_type == "article" && format == "powerRankings") &&
        (!defined(seo.noIndex) || seo.noIndex == false)
      ]{
        slug,
        "lastModified": coalesce(dateModified, date, publishedAt, _createdAt)
      }`
    ),
    client.fetch<SitemappedDocument[]>(
      `*[_type == "fantasyFootball" && published == true]{
        slug,
        "lastModified": coalesce(dateModified, date, publishedAt, _createdAt)
      }`
    ),
    client.fetch<Pick<SitemappedDocument, 'slug'>[]>(
      `*[_type == "category"]{ slug }`
    ),
    client.fetch<Pick<SitemappedDocument, 'slug'>[]>(
      `*[_type == "topicHub" && coalesce(active, true) == true]{ slug }`
    ),
  ]);

  // Latest update time for standings page from teamRecord documents
  const latestTeamRecordUpdatedAt = await client.fetch<string | null>(
    `*[_type == "teamRecord" && defined(_updatedAt)] | order(_updatedAt desc)[0]._updatedAt`
  );
  const standingsLastMod = toValidDate(latestTeamRecordUpdatedAt);

  const dynamicEntries: MetadataRoute.Sitemap = dedupeEntries([
    // Detail pages: always point to final articles path to avoid sitemap URLs that redirect
    ...articles
      .map(r => {
        const slug = safeSlug(r.slug?.current);
        if (!slug) return null;
        return {
          url: `${baseUrl}/articles/${slug}`,
          lastModified: toValidDate(r.lastModified),
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
          lastModified: toValidDate(f.lastModified),
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
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        } satisfies MetadataRoute.Sitemap[number];
      })
      .filter(Boolean) as MetadataRoute.Sitemap,
    ...topicHubs
      .map(hub => {
        const slug = safeSlug(hub.slug?.current);
        if (!slug) return null;
        return {
          url: `${baseUrl}/${slug}`,
          changeFrequency: 'daily' as const,
          priority: 0.7,
        } satisfies MetadataRoute.Sitemap[number];
      })
      .filter(Boolean) as MetadataRoute.Sitemap,
  ]);

  // Power Rankings weekly snapshots
  const rankingWeekDocs: {
    seasonYear?: number
    weekNumber?: number
    playoffRound?: string
    lastModified?: string
  }[] = await client.fetch(`
    *[_type=="article" && format=="powerRankings" && rankingType=="snapshot" && published==true]{
      seasonYear,
      weekNumber,
      playoffRound,
      "lastModified": coalesce(dateModified, date, publishedAt, _createdAt)
    }
  `);
  const rankingWeekEntries: MetadataRoute.Sitemap = dedupeEntries(
    rankingWeekDocs
      .map((s) => {
        if (!s?.seasonYear) return null;
        const weekPart = typeof s.weekNumber === 'number' ? `week-${s.weekNumber}` : s.playoffRound?.toLowerCase();
        if (!weekPart) return null;
        return {
          url: `${baseUrl}/articles/power-rankings/${s.seasonYear}/${weekPart}`,
          lastModified: toValidDate(s.lastModified),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        } satisfies MetadataRoute.Sitemap[number];
      })
      .filter(Boolean) as MetadataRoute.Sitemap
  );

  const teamHubEntries: MetadataRoute.Sitemap = TEAM_ABBRS.map((abbr) => ({
    url: `${baseUrl}/teams/${teamSlug(TEAM_META[abbr].name)}`,
    changeFrequency: 'daily' as const,
    priority: 0.72,
  }));

  return dedupeEntries([
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/categories`,
      changeFrequency: 'weekly',
      priority: 0.55,
    },
    {
      url: `${baseUrl}/headlines`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/articles`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fantasy`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fantasy/mock-draft-simulator`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/standings`,
      lastModified: standingsLastMod,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/schedule`,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/teams`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/newsletter`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/articles/power-rankings`,
      lastModified: toValidDate(
        rankingWeekDocs
          .map((item) => item.lastModified)
          .filter((value): value is string => Boolean(value))
          .sort()
          .at(-1)
      ),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...dynamicEntries,
    ...rankingWeekEntries,
    ...teamHubEntries,
    // Pre-render schedule week pages (1-18)
    ...Array.from({ length: 18 }, (_, i) => ({
      url: `${baseUrl}/schedule/week/${i + 1}`,
      changeFrequency: 'weekly' as const,
      priority: 0.55,
    })),
  ])
}

import { MetadataRoute } from 'next'
import { client } from '../sanity/lib/client'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamesnap.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [headlines, rankings, fantasy] = await Promise.all([
    client.fetch<{slug: {current: string}, _updatedAt: string}[]>(`*[_type == "headline" && published == true]{ slug, _updatedAt }`),
    client.fetch<{slug: {current: string}, _updatedAt: string}[]>(`*[_type == "rankings" && published == true]{ slug, _updatedAt }`),
    client.fetch<{slug: {current: string}, _updatedAt: string}[]>(`*[_type == "fantasyFootball" && published == true]{ slug, _updatedAt }`),
  ]);

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...headlines.map(h => ({
      url: `${baseUrl}/headlines/${h.slug?.current}`,
      lastModified: h._updatedAt ? new Date(h._updatedAt) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...rankings.map(r => ({
      url: `${baseUrl}/rankings/${r.slug?.current}`,
      lastModified: r._updatedAt ? new Date(r._updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...fantasy.map(f => ({
      url: `${baseUrl}/fantasy/${f.slug?.current}`,
      lastModified: f._updatedAt ? new Date(f._updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    })),
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/headlines`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/power-rankings`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/standings`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/newsletter`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    ...dynamicEntries,
  ]
}

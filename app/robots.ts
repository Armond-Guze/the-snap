import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // Social/search crawlers must be able to fetch dynamically generated OG images.
      allow: ['/', '/api/og'],
      disallow: ['/admin/', '/studio/', '/api/'],
    },
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
  }
}

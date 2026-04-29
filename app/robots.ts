import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/studio/', '/api/', '/admin/', '/account', '/sign-in', '/sign-up', '/sso-callback'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}

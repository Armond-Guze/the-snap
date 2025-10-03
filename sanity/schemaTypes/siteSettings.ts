import { defineType, defineField } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'branding', title: 'Branding' },
    { name: 'seo', title: 'Default SEO' },
    { name: 'social', title: 'Social' }
  ],
  fields: [
    defineField({
      name: 'siteName',
      title: 'Primary Site Name',
      type: 'string',
      validation: r => r.required(),
      group: 'branding'
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'branding'
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
      group: 'branding'
    }),
    defineField({
      name: 'defaultOgImage',
      title: 'Default Open Graph Image',
      type: 'image',
      description: 'Used when content lacks its own OG image',
      options: { hotspot: true },
      group: 'seo'
    }),
    defineField({
      name: 'fallbackCanonical',
      title: 'Fallback Canonical Base URL',
      type: 'url',
      description: 'e.g. https://thegamesnap.com',
      group: 'seo'
    }),
    defineField({
      name: 'defaultMetaDescription',
      title: 'Default Meta Description',
      type: 'text',
      rows: 3,
      group: 'seo'
    }),
    defineField({
      name: 'twitterHandle',
      title: 'Twitter / X Handle',
      type: 'string',
      group: 'social'
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      group: 'social',
      of: [{
        type: 'object',
        fields: [
          { name: 'platform', type: 'string', title: 'Platform' },
          { name: 'url', type: 'url', title: 'URL' }
        ],
        preview: {
          select: { title: 'platform', subtitle: 'url' }
        }
      }]
    })
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) }
})

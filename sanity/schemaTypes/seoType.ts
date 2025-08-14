import { defineField, defineType } from 'sanity'

export const seoType = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'autoGenerate',
      title: 'Auto Generate',
      type: 'boolean',
      description: 'When enabled, SEO fields are automatically generated from the title, summary, category and tags. Toggle off to manually override.',
      initialValue: true,
    }),
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'Title that appears in search engines (50-60 characters)',
      validation: (Rule) => Rule.max(60),
      readOnly: ({parent}) => parent?.autoGenerate,
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Description that appears in search engines (150-160 characters)',
      validation: (Rule) => Rule.max(160),
      readOnly: ({parent}) => parent?.autoGenerate,
    }),
    defineField({
      name: 'focusKeyword',
      title: 'Focus Keyword',
      type: 'string',
      description: 'Primary keyword for this content',
      readOnly: ({parent}) => parent?.autoGenerate,
    }),
    defineField({
      name: 'additionalKeywords',
      title: 'Additional Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Additional keywords to target',
      readOnly: ({parent}) => parent?.autoGenerate,
    }),
    defineField({
      name: 'ogTitle',
      title: 'Open Graph Title',
      type: 'string',
      description: 'Title for social media sharing (different from meta title if needed)',
      readOnly: ({parent}) => parent?.autoGenerate,
    }),
    defineField({
      name: 'ogDescription',
      title: 'Open Graph Description',
      type: 'text',
      rows: 2,
      description: 'Description for social media sharing',
      readOnly: ({parent}) => parent?.autoGenerate,
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Image for social media sharing (1200x630px recommended)',
      options: {
        hotspot: true,
      },
      readOnly: ({parent}) => parent?.autoGenerate,
    }),
    defineField({
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      description: 'Prevent search engines from indexing this page',
      initialValue: false,
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      description: 'Canonical URL if different from current URL',
      readOnly: ({parent}) => parent?.autoGenerate,
    }),
    defineField({
      name: 'lastGenerated',
      title: 'Last Generated',
      type: 'datetime',
      description: 'Timestamp when SEO fields were last auto-generated',
      readOnly: true,
      hidden: ({parent}) => !parent?.autoGenerate,
    }),
  ],
  preview: {
    select: {
      title: 'metaTitle',
      subtitle: 'focusKeyword',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'SEO Settings',
        subtitle: subtitle ? `Focus: ${subtitle}` : 'No focus keyword set',
      }
    },
  },
})

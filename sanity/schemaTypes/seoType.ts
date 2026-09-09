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
      description: 'Search title. Review the generated wording for specificity; 30–65 characters is a practical guide, not a keyword target.',
      validation: (Rule) => [
        Rule.max(65).error('Meta title must be 65 characters or fewer'),
        Rule.min(30).warning('Very short titles often lack a clear angle or reader benefit'),
      ],
      readOnly: ({parent}) => parent?.autoGenerate,
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'A complete, specific search description. Aim for roughly 120–160 characters without cutting a sentence in half.',
      validation: (Rule) => [
        Rule.max(160).error('Meta description must be 160 characters or fewer'),
        Rule.min(100).warning('Add more specific context or a clearer reader benefit'),
      ],
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
      hidden: ({parent}) => parent?.autoGenerate,
    }),
    defineField({
      name: 'ogTitle',
      title: 'Open Graph Title',
      type: 'string',
      description: 'Title for social media sharing (different from meta title if needed)',
      readOnly: ({parent}) => parent?.autoGenerate,
      hidden: ({parent}) => parent?.autoGenerate,
    }),
    defineField({
      name: 'ogDescription',
      title: 'Open Graph Description',
      type: 'text',
      rows: 2,
      description: 'Description for social media sharing',
      readOnly: ({parent}) => parent?.autoGenerate,
      hidden: ({parent}) => parent?.autoGenerate,
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
      hidden: ({parent}) => parent?.autoGenerate,
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
      description: 'Use only when this page should consolidate to a different canonical URL. Leave blank for the page’s own URL.',
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

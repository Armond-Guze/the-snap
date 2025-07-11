import { defineField, defineType } from 'sanity'

export const simplifiedSEOType = defineType({
  name: 'simplifiedSeo',
  title: 'SEO Settings',
  type: 'object',
  description: '🤖 Most fields auto-generate from your content. Only override if you need something specific.',
  options: {
    collapsible: true,
    collapsed: false,
  },
  fields: [
    // QUICK INFO
    defineField({
      name: 'info',
      title: 'ℹ️ How This Works',
      type: 'note',
      options: {
        icon: () => '💡',
        tone: 'primary'
      }
    }),
    
    // MANUAL OVERRIDES SECTION
    {
      name: 'overrides',
      title: '✏️ Manual Overrides (Optional)',
      type: 'object',
      description: 'Only fill these if you want something different from the auto-generated values',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Custom Meta Title',
          type: 'string',
          description: 'Override the auto-generated Google search title (max 60 chars)',
          validation: (Rule) => Rule.max(60),
          placeholder: 'Leave blank to auto-generate from article title'
        }),
        defineField({
          name: 'metaDescription',
          title: 'Custom Meta Description',
          type: 'text',
          rows: 3,
          description: 'Override the auto-generated Google search description (max 160 chars)',
          validation: (Rule) => Rule.max(160),
          placeholder: 'Leave blank to auto-generate from summary'
        }),
        defineField({
          name: 'ogImage',
          title: 'Custom Social Media Image',
          type: 'image',
          description: 'Override the auto-used cover image for Facebook/Twitter sharing',
          options: {
            hotspot: true,
          },
        }),
      ]
    },

    // AUTO-GENERATED PREVIEW SECTION
    {
      name: 'preview',
      title: '🤖 Auto-Generated Preview',
      type: 'object',
      description: 'These values are automatically created from your content',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'focusKeyword',
          title: 'Focus Keyword',
          type: 'string',
          description: 'Automatically detected from title and content',
          readOnly: true,
          initialValue: 'Auto-generated from content'
        }),
        defineField({
          name: 'additionalKeywords',
          title: 'Additional Keywords',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Automatically generated from tags, teams mentioned, and content',
          readOnly: true,
        }),
        defineField({
          name: 'ogTitle',
          title: 'Social Media Title',
          type: 'string',
          description: 'Auto-uses article title',
          readOnly: true,
        }),
        defineField({
          name: 'ogDescription',
          title: 'Social Media Description',
          type: 'string',
          description: 'Auto-uses meta description',
          readOnly: true,
        }),
      ]
    },

    // ADVANCED SETTINGS SECTION
    {
      name: 'advanced',
      title: '🔧 Advanced Settings',
      type: 'object',
      description: 'Advanced SEO options - rarely needed',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'noIndex',
          title: 'Hide from Search Engines',
          type: 'boolean',
          description: 'Check to prevent Google from indexing this page',
          initialValue: false,
        }),
        defineField({
          name: 'canonicalUrl',
          title: 'Canonical URL',
          type: 'url',
          description: 'Only use if this content exists elsewhere (prevents duplicate content issues)',
        }),
      ]
    },

    // BACKWARD COMPATIBILITY (hidden fields)
    defineField({
      name: 'metaTitle',
      title: 'Meta Title (Legacy)',
      type: 'string',
      hidden: true, // Keep for existing data but hide from UI
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description (Legacy)',
      type: 'text',
      hidden: true, // Keep for existing data but hide from UI
    }),
    defineField({
      name: 'focusKeyword',
      title: 'Focus Keyword (Legacy)',
      type: 'string',
      hidden: true, // Keep for existing data but hide from UI
    }),
    defineField({
      name: 'additionalKeywords',
      title: 'Additional Keywords (Legacy)',
      type: 'array',
      of: [{ type: 'string' }],
      hidden: true, // Keep for existing data but hide from UI
    }),
    defineField({
      name: 'ogTitle',
      title: 'OG Title (Legacy)',
      type: 'string',
      hidden: true, // Keep for existing data but hide from UI
    }),
    defineField({
      name: 'ogDescription',
      title: 'OG Description (Legacy)',
      type: 'string',
      hidden: true, // Keep for existing data but hide from UI
    }),
    defineField({
      name: 'ogImage',
      title: 'OG Image (Legacy)',
      type: 'image',
      hidden: true, // Keep for existing data but hide from UI
    }),
    defineField({
      name: 'noIndex',
      title: 'No Index (Legacy)',
      type: 'boolean',
      hidden: true, // Keep for existing data but hide from UI
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL (Legacy)',
      type: 'url',
      hidden: true, // Keep for existing data but hide from UI
    }),
  ],
  
  preview: {
    select: {
      customTitle: 'overrides.metaTitle',
      focusKeyword: 'preview.focusKeyword',
    },
    prepare({ customTitle, focusKeyword }) {
      return {
        title: customTitle ? '✏️ Custom SEO' : '🤖 Auto-Generated SEO',
        subtitle: focusKeyword || 'Auto-generated from content',
      }
    },
  },
})

// Note type for the info section
export const noteType = defineType({
  name: 'note',
  title: 'Note',
  type: 'object',
  fields: [
    {
      name: 'message',
      type: 'text',
      initialValue: '✨ Your SEO fields auto-generate from your article title, summary, and tags. You only need to fill the override fields if you want something different from the automatic values.',
    }
  ],
  preview: {
    select: {
      message: 'message'
    },
    prepare({ message }) {
      return {
        title: 'ℹ️ SEO Auto-Generation Info',
        subtitle: message
      }
    }
  }
})

// Export both for backward compatibility
export const seoType = simplifiedSEOType;

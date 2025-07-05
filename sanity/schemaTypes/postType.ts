import {DocumentTextIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),

    // SEO Fields Group
    defineField({
      name: "seo",
      title: "SEO Settings",
      type: "object",
      group: "seo",
      fields: [
        defineField({
          name: "metaTitle",
          title: "Meta Title",
          type: "string",
          description: "SEO title for search engines (50-60 characters recommended)",
          validation: (Rule) => Rule.max(60).warning("Keep under 60 characters for best SEO"),
        }),
        defineField({
          name: "metaDescription",
          title: "Meta Description",
          type: "text",
          rows: 3,
          description: "SEO description for search engines (150-160 characters recommended)",
          validation: (Rule) => Rule.max(160).warning("Keep under 160 characters for best SEO"),
        }),
        defineField({
          name: "focusKeyword",
          title: "Focus Keyword",
          type: "string",
          description: "Primary keyword you want to rank for",
        }),
        defineField({
          name: "additionalKeywords",
          title: "Additional Keywords",
          type: "array",
          of: [{ type: "string" }],
          description: "Secondary keywords to target",
        }),
        defineField({
          name: "ogTitle",
          title: "Open Graph Title",
          type: "string",
          description: "Title for social media sharing (leave blank to use meta title)",
        }),
        defineField({
          name: "ogDescription",
          title: "Open Graph Description",
          type: "text",
          rows: 2,
          description: "Description for social media sharing (leave blank to use meta description)",
        }),
        defineField({
          name: "ogImage",
          title: "Open Graph Image",
          type: "image",
          description: "Image for social media sharing (1200x630px recommended)",
          options: { hotspot: true },
        }),
        defineField({
          name: "noIndex",
          title: "No Index",
          type: "boolean",
          description: "Prevent search engines from indexing this page",
          initialValue: false,
        }),
        defineField({
          name: "canonicalUrl",
          title: "Canonical URL",
          type: "url",
          description: "Override the canonical URL (leave blank for auto-generated)",
        }),
      ],
    }),

    defineField({
      name: 'author',
      type: 'reference',
      to: {type: 'author'},
    }),
    defineField({
      name: 'mainImage',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        })
      ]
    }),
    defineField({
      name: 'categories',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: {type: 'category'}})],
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
    }),
    defineField({
      name: 'body',
      type: 'blockContent',
    }),
  ],
  groups: [
    {
      name: "seo",
      title: "SEO",
    },
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare(selection) {
      const {author} = selection
      return {...selection, subtitle: author && `by ${author}`}
    },
  },
})

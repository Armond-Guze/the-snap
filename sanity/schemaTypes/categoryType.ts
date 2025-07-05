import {TagIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const categoryType = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Category Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(50),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Category Description',
      type: 'text',
      validation: (Rule) => Rule.max(200),
    }),
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
      ],
    }),
    defineField({
      name: 'color',
      title: 'Category Color',
      type: 'string',
      options: {
        list: [
          { title: 'Red', value: 'red' },
          { title: 'Blue', value: 'blue' },
          { title: 'Green', value: 'green' },
          { title: 'Yellow', value: 'yellow' },
          { title: 'Purple', value: 'purple' },
          { title: 'Orange', value: 'orange' },
          { title: 'Gray', value: 'gray' },
        ],
      },
      initialValue: 'gray',
    }),
    defineField({
      name: 'priority',
      title: 'Display Priority',
      type: 'number',
      description: 'Lower numbers show first in category lists',
      validation: (Rule) => Rule.min(1).max(100),
      initialValue: 50,
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
      subtitle: 'description',
    },
  },
})

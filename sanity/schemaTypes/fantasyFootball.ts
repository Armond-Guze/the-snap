import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'fantasyFootball',
  title: 'Fantasy Football',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.max(200)
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: { type: 'author' },
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      description: 'Lower numbers appear first (1 = highest priority)',
      validation: Rule => Rule.min(1).max(100),
      initialValue: 50,
    }),
    defineField({
      name: 'fantasyType',
      title: 'Fantasy Type',
      type: 'string',
      options: {
        list: [
          { title: 'Player Analysis', value: 'player-analysis' },
          { title: 'Week Preview', value: 'week-preview' },
          { title: 'Start/Sit', value: 'start-sit' },
          { title: 'Waiver Wire', value: 'waiver-wire' },
          { title: 'Trade Analysis', value: 'trade-analysis' },
          { title: 'Draft Strategy', value: 'draft-strategy' },
          { title: 'Injury Report', value: 'injury-report' },
          { title: 'General Tips', value: 'general-tips' },
        ],
      },
      initialValue: 'general-tips',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
        },
        {
          type: 'image',
          options: { hotspot: true },
        },
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      validation: Rule => Rule.max(60),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.max(160),
    }),
  ],

  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      publishedAt: 'publishedAt',
      priority: 'priority',
      fantasyType: 'fantasyType',
      media: 'coverImage',
    },
    prepare(selection) {
      const { author, publishedAt, priority, fantasyType } = selection
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString() : 'No date'
      const typeLabel = fantasyType ? fantasyType.replace('-', ' ').toUpperCase() : ''
      
      return {
        ...selection,
        subtitle: `${typeLabel} - ${author || 'No author'} - ${date} (Priority: ${priority})`,
      }
    },
  },

  orderings: [
    {
      title: 'Priority (Highest First)',
      name: 'priority',
      by: [
        { field: 'priority', direction: 'asc' },
        { field: 'publishedAt', direction: 'desc' },
      ],
    },
    {
      title: 'Published Date (Newest First)',
      name: 'publishedAt',
      by: [
        { field: 'publishedAt', direction: 'desc' },
      ],
    },
    {
      title: 'Fantasy Type',
      name: 'fantasyType',
      by: [
        { field: 'fantasyType', direction: 'asc' },
        { field: 'priority', direction: 'asc' },
      ],
    },
  ],
})

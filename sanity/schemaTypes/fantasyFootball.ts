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
      validation: Rule => Rule.max(300)
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
      title: 'Published Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
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
    // Main rich text body (mirrors headline body)
    defineField({
      name: 'content',
      title: 'Body Content',
      type: 'blockContent',
    }),
    // Optional YouTube video embed fields
    defineField({
      name: 'youtubeVideoId',
      title: 'YouTube Video ID',
      type: 'string',
      description: "11‑character video id from https://www.youtube.com/watch?v=XXXX (paste the part after v=)",
      validation: Rule => Rule.regex(/^[a-zA-Z0-9_-]{11}$/, { name: 'YouTube Video ID' }).error('Must be a valid 11‑character YouTube ID'),
    }),
    defineField({
      name: 'videoTitle',
      title: 'Video Title',
      type: 'string',
      description: 'Optional custom title for the video embed',
      hidden: ({ document }) => !document?.youtubeVideoId,
    }),
    // Twitter/X embed
    defineField({
      name: 'twitterUrl',
      title: 'Twitter/X Post URL',
      type: 'url',
      description: 'Full tweet URL (https://twitter.com/<user>/status/<id>)',
      validation: Rule => Rule.uri({ scheme: ['https'] }).custom(url => {
        if (!url) return true;
        return /^https:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url) || 'Must be a valid Twitter/X status URL';
      })
    }),
    defineField({
      name: 'twitterTitle',
      title: 'Twitter Embed Title',
      type: 'string',
      hidden: ({ document }) => !document?.twitterUrl,
    }),
    // Category reference (optional to group fantasy articles similarly to headlines)
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Enter relevant tags (press enter after each)',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      initialValue: { autoGenerate: true },
      options: { collapsible: true, collapsed: false },
    }),
  ],

  groups: [
    { name: 'seo', title: 'SEO' },
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'author.name',
      media: 'coverImage',
      fantasyType: 'fantasyType',
      publishedAt: 'publishedAt',
    },
    prepare({ title, subtitle, media, fantasyType, publishedAt }) {
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString() : '';
      const typeLabel = fantasyType ? fantasyType.replace('-', ' ').toUpperCase() : '';
      return {
        title,
        subtitle: [typeLabel, subtitle, date].filter(Boolean).join(' • '),
        media,
      };
    }
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

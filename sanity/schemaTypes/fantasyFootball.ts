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
      name: 'homepageTitle',
      title: 'Homepage Display Title',
      type: 'string',
      description: 'Optional shorter version for homepage modules; full Title still used on detail page & SEO.',
  validation: Rule => Rule.max(70).error('Homepage Display Title must be 70 characters or fewer'),
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
      title: 'YouTube Video ID or URL',
      type: 'string',
      description: 'Paste either the 11‑char ID or a full YouTube link (watch/shorts/youtu.be). We\'ll extract the ID automatically.',
      validation: (Rule) => Rule.custom((val) => {
        if (!val) return true;
        const raw = String(val).trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return true;
        try {
          const url = new URL(raw);
          const v = url.searchParams.get('v');
          if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return true;
          if (/\/(shorts|embed|live)\/[a-zA-Z0-9_-]{11}/.test(url.pathname)) return true;
          if (url.hostname.toLowerCase().endsWith('youtu.be')) {
            const id = url.pathname.split('/').filter(Boolean)[0];
            if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return true;
          }
        } catch {}
        return 'Enter a valid YouTube ID or URL';
      })
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
    // Instagram embed
    defineField({
      name: 'instagramUrl',
      title: 'Instagram Post URL',
      type: 'url',
      description: 'Public Instagram post or reel URL',
      validation: Rule => Rule.uri({ scheme: ['https'] }).custom(url => {
        if (!url) return true;
        return /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/.test(url) || 'Must be a valid Instagram post/reel URL';
      })
    }),
    defineField({
      name: 'instagramTitle',
      title: 'Instagram Embed Title',
      type: 'string',
      hidden: ({ document }) => !document?.instagramUrl,
    }),
    // TikTok embed
    defineField({
      name: 'tiktokUrl',
      title: 'TikTok Video URL',
      type: 'url',
      description: 'TikTok video URL (https://www.tiktok.com/@user/video/<id>)',
      validation: Rule => Rule.uri({ scheme: ['https'] }).custom(url => {
        if (!url) return true;
        return /^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/[0-9]+\/?/.test(url) || 'Must be a valid TikTok video URL';
      })
    }),
    defineField({
      name: 'tiktokTitle',
      title: 'TikTok Embed Title',
      type: 'string',
      hidden: ({ document }) => !document?.tiktokUrl,
    }),
    // Category reference for category hub routing and archive pages
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (Rule) =>
        Rule.custom((val, ctx) => {
          if (!ctx.document?.published) return true;
          return val ? true : 'Category is required before publishing';
        }),
    }),
    defineField({
      name: 'topicHubs',
      title: 'Topic Hubs',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'topicHub' }] }],
      options: { layout: 'tags' },
      description: 'Assign this fantasy article to one or more hub pages (example: Draft).',
      validation: (Rule) => Rule.unique().error('Topic hub already added'),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'LEGACY free-form tags (will be migrated to references).',
    }),
    defineField({
      name: 'tagRefs',
      title: 'Tag References',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'advancedTag' }] }],
      options: { layout: 'tags' },
      description: 'Preferred canonical tag references.',
      group: 'seo'
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

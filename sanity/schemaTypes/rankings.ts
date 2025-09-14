import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'rankings',
  title: 'Rankings',
  type: 'document',
  description: 'Ranking articles with structured team / player ordering plus optional full article body & embeds.',
  groups: [
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'homepageTitle',
      title: 'Homepage Display Title',
      type: 'string',
      description: 'Optional shorter / punchier title ONLY for homepage & side modules. Full Title still used for detail page + SEO.',
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rankingType',
      title: 'Ranking Type',
      type: 'string',
      options: {
        list: [
          { title: 'Offensive Rankings', value: 'offense' },
          { title: 'Defensive Rankings', value: 'defense' },
          { title: 'Rookie Rankings', value: 'rookie' },
          { title: 'Fantasy QB Rankings', value: 'fantasy-qb' },
          { title: 'Fantasy RB Rankings', value: 'fantasy-rb' },
          { title: 'Fantasy WR Rankings', value: 'fantasy-wr' },
          { title: 'Fantasy TE Rankings', value: 'fantasy-te' },
          { title: 'Draft Rankings', value: 'draft' },
          { title: 'Position Rankings', value: 'position' },
          { title: 'Team Rankings', value: 'team' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
      description: 'Choose the structural context for these rankings (used for filtering / display labels).'
    }),
    defineField({
      name: 'season',
      title: 'Season Year',
      type: 'number',
      description: 'Season these rankings belong to (e.g., 2025). Used for weekly snapshots.',
      validation: (Rule) => Rule.required().min(2000).max(2100),
    }),
    defineField({
      name: 'currentWeek',
      title: 'Current Week',
      type: 'number',
      description: 'Set to the NFL week number you are publishing (1–25 including preseason/postseason).',
      validation: (Rule) => Rule.required().min(1).max(25),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.max(300),
      description: '1–3 sentence synopsis (also used for SEO description when auto-generate enabled).'
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'players',
      title: 'Related Players',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'player' }],
          options: { disableNew: false }
        }
      ],
      description: 'Associate one or more players mentioned here for richer linking & filtering.',
      options: { layout: 'tags' }
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Enter relevant tags for this rankings article (one per tag).'
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Main image used for cards and previews',
    }),
    defineField({
      name: 'articleImage',
      title: 'Article Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Optional image to display within the body (if provided).'
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
      name: 'body',
      title: 'Body Content',
      type: 'blockContent',
      description: 'Primary article-style body above the structured rankings list.'
    }),
    defineField({
      name: 'showAsArticle',
      title: 'Show As Article Layout',
      type: 'boolean',
      initialValue: false,
      description: 'Toggle to render this rankings page in an article-style layout before the rankings list.'
    }),
    defineField({
      name: 'articleContent',
      title: 'Article Content (Optional)',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Optional rich article content used when Show As Article Layout is enabled. If empty, body content will be used.',
      hidden: ({ document }) => !document?.showAsArticle,
    }),
    defineField({
      name: 'viewCount',
      title: 'View Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'youtubeVideoId',
      title: 'YouTube Video ID',
      type: 'string',
      description: 'Enter the YouTube video ID (e.g., dQw4w9WgXcQ).'
    }),
    defineField({
      name: 'videoTitle',
      title: 'Video Title',
      type: 'string',
      description: 'Optional custom title for the video embed',
      hidden: ({ document }) => !document?.youtubeVideoId,
    }),
    defineField({
      name: 'twitterUrl',
      title: 'Twitter/X Post URL',
      type: 'url',
      description: 'Full Twitter/X post URL',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }).custom(url => {
        if (!url) return true;
        return /^https:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/i.test(url) || 'Must be a valid Twitter/X post URL';
      })
    }),
    defineField({
      name: 'twitterTitle',
      title: 'Twitter Embed Title',
      type: 'string',
      hidden: ({ document }) => !document?.twitterUrl,
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram Post URL',
      type: 'url',
      description: 'Public Instagram post / reel URL',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }).custom(url => {
        if (!url) return true;
        return /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/.test(url) || 'Must be a valid Instagram post, reel, or IGTV URL';
      })
    }),
    defineField({
      name: 'instagramTitle',
      title: 'Instagram Embed Title',
      type: 'string',
      hidden: ({ document }) => !document?.instagramUrl,
    }),
    defineField({
      name: 'tiktokUrl',
      title: 'TikTok Video URL',
      type: 'url',
      description: 'TikTok video URL',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }).custom(url => {
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
    defineField({
      name: 'teams',
      title: 'Team Rankings',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'rank',
              title: 'Rank',
              type: 'number',
              validation: (Rule) => Rule.required().min(1).max(32),
            }),
            defineField({
              name: 'previousRank',
              title: 'Previous Rank',
              type: 'number',
              validation: (Rule) => Rule.min(1).max(32),
            }),
            defineField({
              name: 'teamName',
              title: 'Team Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'teamLogo',
              title: 'Team Logo',
              type: 'image',
              options: {
                hotspot: true,
              },
            }),
            defineField({
              name: 'teamColor',
              title: 'Team Color',
              type: 'string',
              description: 'Hex color code for team (e.g., #FF0000)',
            }),
            defineField({
              name: 'summary',
              title: 'Summary',
              type: 'string',
              description: 'Brief summary for this ranking',
            }),
            defineField({
              name: 'analysis',
              title: 'Analysis',
              type: 'array',
              of: [{ type: 'block' }],
              description: 'Detailed analysis for this ranking position',
            }),
            defineField({
              name: 'stats',
              title: 'Key Stats',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Stat Label',
                      type: 'string',
                    }),
                    defineField({
                      name: 'value',
                      title: 'Stat Value',
                      type: 'string',
                    }),
                  ],
                },
              ],
            }),
          ],
          preview: {
            select: {
              rank: 'rank',
              teamName: 'teamName',
              summary: 'summary',
              media: 'teamLogo',
            },
            prepare({ rank, teamName, summary, media }) {
              return {
                title: `${rank}. ${teamName}`,
                subtitle: summary,
                media,
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.custom((arr: unknown) => {
        if (!Array.isArray(arr)) return true;
        const ranks = arr
          .map((t) => (t && typeof t === 'object' && 'rank' in t ? (t as { rank?: unknown }).rank : undefined))
          .filter((n): n is number => typeof n === 'number');
        if (ranks.length !== 32) return 'Exactly 32 teams are required';
        const set = new Set(ranks);
        if (set.size !== 32) return 'Ranks must be unique 1–32';
        const min = Math.min(...ranks), max = Math.max(...ranks);
        if (min !== 1 || max !== 32) return 'Ranks must cover 1 through 32 with no gaps';
        return true;
      }),
    }),
    defineField({
      name: 'methodology',
      title: 'Methodology',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Explanation of how these rankings were determined',
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      description: '(Optional / legacy) Lower numbers can be surfaced first in certain custom lists.',
      validation: Rule => Rule.min(1).max(100)
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      initialValue: { autoGenerate: true },
      options: { collapsible: true, collapsed: false },
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      rankingType: 'rankingType',
      author: 'author.name',
      media: 'coverImage',
    },
    prepare({ title, rankingType, author, media }) {
      return {
        title,
        subtitle: `${rankingType?.toUpperCase()} by ${author}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Published Date (Newest First)',
      name: 'publishedAtDesc',
      by: [
        { field: 'publishedAt', direction: 'desc' },
      ],
    },
    {
      title: 'Title (A → Z)',
      name: 'titleAsc',
      by: [
        { field: 'title', direction: 'asc' },
      ],
    },
  ],
})

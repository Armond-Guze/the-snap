import { defineType, defineField } from 'sanity'

export const playOfWeek = defineType({
  name: 'playOfWeek',
  title: 'Play of the Week',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(5).max(120),
      group: 'quick',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        slugify: (input) =>
          input
            .toLowerCase()
            .replace(/'|'|"|"/g, "'")
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
      group: 'quick',
    }),
    defineField({
      name: 'playType',
      title: 'Play Type',
      type: 'string',
      options: {
        list: [
          'Touchdown',
          'Interception',
          'Pick-Six',
          'Sack',
          'Strip Sack',
          'Fumble',
          'Block',
          'Return TD',
          'Clutch Catch',
          'Goal Line Stand',
          'Trick Play',
          'Special Teams',
        ],
        layout: 'dropdown',
      },
      group: 'quick',
    }),
    defineField({
      name: 'teams',
      title: 'Teams Involved',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
      options: { layout: 'tags' },
      description: 'Pick the team tags (typically two NFL teams).',
      group: 'quick',
    }),
    defineField({
      name: 'player',
      title: 'Primary Player',
      type: 'reference',
      to: [{ type: 'player' }],
      description: 'Headline player for the play.',
      group: 'quick',
    }),
    defineField({
      name: 'skillBadges',
      title: 'Skill Badges',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
        list: ['SPEED', 'POWER', 'IQ', 'CHAOS', 'SKILL'],
      },
      description: 'Select one or more badges to tag the play style.',
      group: 'flair',
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty (1-5)',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(5),
      description: 'Level-style difficulty dial (1 easiest, 5 hardest).',
      group: 'flair',
    }),
    defineField({
      name: 'difficultyNote',
      title: 'Difficulty Note',
      type: 'string',
      description: 'Optional note to explain the difficulty rating.',
      group: 'flair',
    }),
    defineField({
      name: 'momentumDirection',
      title: 'Momentum Direction',
      type: 'string',
      options: { list: ['Big Swing', 'Momentum Boost', 'Neutral', 'Momentum Loss'] },
      group: 'flair',
    }),
    defineField({
      name: 'momentumMagnitude',
      title: 'Momentum Magnitude (1-3)',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(3),
      description: 'Scales the arrow size on the graphic.',
      group: 'flair',
    }),
    defineField({
      name: 'impactTags',
      title: 'Impact Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Context like 3rd & Long, Goal Line, Two-Minute, Special Teams.',
      group: 'flair',
    }),
    defineField({
      name: 'summary',
      title: 'One-Line Summary',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.max(200),
      group: 'quick',
    }),
    defineField({
      name: 'callout',
      title: 'Callout Quote',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.max(200),
      group: 'quick',
    }),
    defineField({
      name: 'date',
      title: 'Play Date/Time',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      group: 'quick',
    }),
    defineField({
      name: 'quarter',
      title: 'Quarter',
      type: 'string',
      options: { list: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'] },
      group: 'metrics',
    }),
    defineField({
      name: 'clock',
      title: 'Game Clock (mm:ss)',
      type: 'string',
      validation: (Rule) => Rule.regex(/^\d{1,2}:\d{2}$/).error('Use mm:ss'),
      group: 'metrics',
    }),
    defineField({
      name: 'downDistance',
      title: 'Down & Distance',
      type: 'string',
      description: 'Example: 3rd & 7',
      group: 'metrics',
    }),
    defineField({
      name: 'yardLine',
      title: 'Yard Line',
      type: 'string',
      description: 'Example: DAL 42 or SEA 8',
      group: 'metrics',
    }),
    defineField({
      name: 'yardsGained',
      title: 'Yards Gained',
      type: 'number',
      group: 'metrics',
    }),
    defineField({
      name: 'scoreBefore',
      title: 'Score Before Play',
      type: 'string',
      description: 'Example: SF 17 - KC 20',
      group: 'metrics',
    }),
    defineField({
      name: 'scoreAfter',
      title: 'Score After Play',
      type: 'string',
      group: 'metrics',
    }),
    defineField({
      name: 'epaDelta',
      title: 'EPA Delta',
      type: 'number',
      description: 'Estimated points added for the play (optional).',
      group: 'metrics',
    }),
    defineField({
      name: 'winProbDelta',
      title: 'Win Probability Delta (%)',
      type: 'number',
      description: 'Change in win probability from the play (optional).',
      group: 'metrics',
    }),
    defineField({
      name: 'body',
      title: 'Breakdown',
      type: 'blockContent',
      group: 'advanced',
    }),
    defineField({
      name: 'clipUrl',
      title: 'Clip URL',
      type: 'url',
      description: 'Video of the play (YouTube, X/Twitter, TikTok, Instagram).',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }).custom((url) => {
        if (!url) return true
        const allowed = /^(https?:\/\/)?([\w.-]+)\.(youtube\.com|youtu\.be|x\.com|twitter\.com|tiktok\.com|instagram\.com|vimeo\.com)/i
        return allowed.test(url) || 'Must be YouTube, X/Twitter, TikTok, Instagram, or Vimeo URL'
      }),
      group: 'embeds',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      group: 'media',
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
      group: 'quick',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      initialValue: { autoGenerate: true },
      options: { collapsible: true, collapsed: true },
    }),
    defineField({
      name: 'priority',
      title: 'Priority (optional)',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(100),
      description: 'Lower numbers can be treated as more prominent.',
      group: 'advanced',
    }),
  ],
  groups: [
    { name: 'quick', title: 'Quick Publish' },
    { name: 'media', title: 'Media' },
    { name: 'embeds', title: 'Embeds' },
    { name: 'flair', title: 'Flair' },
    { name: 'metrics', title: 'Metrics' },
    { name: 'seo', title: 'SEO' },
    { name: 'advanced', title: 'Advanced' },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'player.name',
      media: 'coverImage',
      playType: 'playType',
    },
    prepare(selection) {
      const { title, subtitle, media, playType } = selection
      const sub = [playType, subtitle].filter(Boolean).join(' • ')
      return { title, subtitle: sub, media }
    },
  },
  orderings: [
    {
      title: 'Date (Newest First)',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
    {
      title: 'Difficulty (High First)',
      name: 'difficultyDesc',
      by: [{ field: 'difficulty', direction: 'desc' }, { field: 'date', direction: 'desc' }],
    },
    {
      title: 'Title (A → Z)',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
})

export default playOfWeek

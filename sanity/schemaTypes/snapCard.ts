import {defineField, defineType} from 'sanity'

const SERIES_OPTIONS = [
  {title: 'Aura Meter', value: 'aura-meter'},
  {title: 'Impact Meter', value: 'impact-meter'},
  {title: 'Violence Scale', value: 'violence-scale'},
  {title: 'Cooked Meter', value: 'cooked-meter'},
  {title: 'Heat Check', value: 'heat-check'},
  {title: 'Snap Card (general)', value: 'general'},
]

const POSITION_OPTIONS = ['QB', 'WR', 'RB', 'TE', 'OL', 'DL', 'EDGE', 'LB', 'CB', 'S', 'ST', 'Coach', 'Team', 'Unit'] as const

export const snapCard = defineType({
  name: 'snapCard',
  title: 'Snap Card',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(110),
      description: 'Punchy, social-ready line for the card.',
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
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'series',
      title: 'Series / Meter',
      type: 'string',
      options: {
        list: SERIES_OPTIONS,
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'season',
      title: 'Season (year)',
      type: 'number',
      description: 'For weekly queries such as "Week 16 Snap Cards".',
      validation: (Rule) => Rule.min(2020).max(2100),
    }),
    defineField({
      name: 'week',
      title: 'Week',
      type: 'number',
      validation: (Rule) => Rule.min(1).max(30),
    }),
    defineField({
      name: 'position',
      title: 'Position / Unit',
      type: 'string',
      options: {
        list: POSITION_OPTIONS.map((p) => ({title: p, value: p})),
        layout: 'dropdown',
      },
      description: 'Who/what this card is about. Can be a position, coach, team, or unit.',
    }),
    defineField({
      name: 'team',
      title: 'Team (abbr)',
      type: 'string',
      validation: (Rule) => Rule.max(4),
      description: 'Optional 2–3 letter code (KC, DAL, etc) for filtering.',
    }),
    defineField({
      name: 'player',
      title: 'Player (reference)',
      type: 'reference',
      to: [{type: 'player'}],
      description: 'Optional link to the player profile.',
    }),
    defineField({
      name: 'lede',
      title: 'Lede (1–2 sentences)',
      type: 'text',
      rows: 3,
      description: 'Short explainer used on list pages and social previews.',
      validation: (Rule) => Rule.required().max(220),
    }),
    defineField({
      name: 'graphic',
      title: 'Graphic Payload',
      type: 'snapGraphicCard',
      description: 'Single source of truth for the meter graphic (grade, meters, trajectory, dawg index, media, etc.).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Optional quick filters ("Week 16", "Playoffs", "Primetime", etc.).',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO (optional)',
      type: 'seo',
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      series: 'series',
      week: 'week',
      season: 'season',
      media: 'graphic.media.image',
    },
    prepare(sel) {
      const badge = sel.series ? sel.series.replace(/-/g, ' ') : 'snap card'
      const week = sel.week ? ` • Week ${sel.week}` : ''
      const season = sel.season ? ` (${sel.season})` : ''
      return {
        title: sel.title || 'Snap Card',
        subtitle: `${badge}${week}${season}`,
        media: sel.media,
      }
    },
  },
})

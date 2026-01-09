import { defineField, defineType } from 'sanity'

const insightTagOptions = [
  { title: 'Storyline', value: 'Storyline' },
  { title: 'Fantasy', value: 'Fantasy' },
  { title: 'Trend', value: 'Trend' },
  { title: 'Sponsor', value: 'Sponsor' },
]

export const gameCenterSettings = defineType({
  name: 'gameCenterSettings',
  title: 'GameCenter Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'gameId',
      title: 'Game ID',
      type: 'string',
      description: 'Matches the gameId from schedule JSON or ESPN event id (e.g., 401671620).',
      validation: (Rule) => Rule.required().error('Game ID is required'),
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Title Override',
      type: 'string',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle Override',
      type: 'string',
    }),
    defineField({
      name: 'heroStatusLabel',
      title: 'Status Label Override',
      type: 'string',
      description: 'Optional custom tag (e.g., Presented Live, Spotlight Game).',
    }),
    defineField({
      name: 'heroBackground',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'sponsorPanel',
      title: 'Sponsor Panel',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string', description: 'Default: Presented by' }),
        defineField({ name: 'ctaText', title: 'CTA Text', type: 'string' }),
        defineField({ name: 'ctaUrl', title: 'CTA URL', type: 'url' }),
        defineField({ name: 'backgroundHex', title: 'Background Hex', type: 'string', description: '#0f172a' }),
        defineField({ name: 'logo', title: 'Sponsor Logo', type: 'image', options: { hotspot: true } }),
      ],
    }),
    defineField({
      name: 'insightMode',
      title: 'Insight Mode',
      type: 'string',
      options: {
        list: [
          { title: 'Replace defaults with custom list', value: 'replace' },
          { title: 'Append custom insights before defaults', value: 'append' },
        ],
        layout: 'radio',
      },
      initialValue: 'replace',
    }),
    defineField({
      name: 'customInsights',
      title: 'Custom Insights',
      type: 'array',
      of: [
        defineField({
          name: 'insight',
          type: 'object',
          fields: [
            defineField({
              name: 'tag',
              title: 'Tag',
              type: 'string',
              options: { list: insightTagOptions },
            }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'body', title: 'Body', type: 'text', rows: 3 }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'curatedArticles',
      title: 'Curated Articles',
      type: 'array',
      description: 'Ordered editorial picks to highlight under the insights module.',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'headline' },
            { type: 'fantasyFootball' },
            { type: 'article' },
          ],
          options: { disableNew: true },
        },
      ],
    }),
    defineField({
      name: 'editorNotes',
      title: 'Editor Notes',
      type: 'text',
    }),
  ],
  preview: {
    select: { title: 'gameId', subtitle: 'heroTitle' },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Unlinked Game',
        subtitle: subtitle || 'GameCenter overrides',
      }
    },
  },
})

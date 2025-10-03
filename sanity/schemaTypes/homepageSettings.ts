import { defineType, defineField } from 'sanity'

export const homepageSettings = defineType({
  name: 'homepageSettings',
  title: 'Homepage Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'heroCurated',
      title: 'Hero Curated Articles',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'headline' }, { type: 'fantasyFootball' }] }],
      description: 'If set, homepage hero uses these in order; otherwise falls back to newest.'
    }),
    defineField({
      name: 'promotedFantasyTypes',
      title: 'Promoted Fantasy Types',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Overrides default ordering / emphasis for fantasy modules.'
    }),
    defineField({
      name: 'featuredTags',
      title: 'Featured Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Displayed in homepage tag highlights.'
    }),
    defineField({
      name: 'pinnedHeadlines',
      title: 'Pinned Headlines (Drag to reorder)',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'headline' }],
          options: { disableNew: true }
        }
      ],
      description: 'These headlines appear FIRST on the homepage in this exact order. Leave empty to just use the newest headlines automatically.'
    }),
    defineField({
      name: 'editorNotes',
      title: 'Editor Notes',
      type: 'text',
      rows: 3,
      description: 'Optional internal notes for editors (not shown on site).'
    })
  ],
  preview: {
    prepare: () => ({ title: 'Homepage Settings' })
  }
})

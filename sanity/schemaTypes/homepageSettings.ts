import { defineType, defineField } from 'sanity'

export const homepageSettings = defineType({
  name: 'homepageSettings',
  title: 'Homepage Settings',
  type: 'document',
  fields: [
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

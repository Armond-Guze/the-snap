import { defineType, defineField } from 'sanity'

export const playerType = defineType({
  name: 'player',
  title: 'Player',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() }),
    defineField({
      name: 'aliases',
      title: 'Aliases',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Optional alternate spellings or nickname variants to improve search and reference matching.',
    }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name', maxLength: 96 }, validation: Rule => Rule.required() }),
    defineField({ name: 'team', title: 'Team', type: 'string', description: 'Use short code (e.g. DAL, BUF) or full team name.' }),
    defineField({ name: 'position', title: 'Position', type: 'string' }),
    defineField({ name: 'headshot', title: 'Headshot', type: 'image', options: { hotspot: true }, fields: [{ name: 'alt', type: 'string', title: 'Alt Text' }] }),
    defineField({ name: 'bio', title: 'Short Bio', type: 'text', rows: 3 }),
    defineField({ name: 'active', title: 'Active', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'team', media: 'headshot' }
  }
})

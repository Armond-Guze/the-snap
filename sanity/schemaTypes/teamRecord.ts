import { defineField, defineType } from 'sanity'

export const teamRecord = defineType({
  name: 'teamRecord',
  title: 'NFL Team Record',
  type: 'document',
  fields: [
    defineField({
      name: 'teamAbbr',
      title: 'Team Abbreviation',
      type: 'string',
      validation: (Rule) => Rule.required().uppercase().regex(/^[A-Z]{2,3}$/),
      description: 'Team code like KC, SF, BUF, etc.'
    }),
    defineField({
      name: 'season',
      title: 'Season',
      type: 'number',
      initialValue: 2025,
      validation: (Rule) => Rule.required().min(2000).max(2100)
    }),
    defineField({ name: 'wins', title: 'Wins', type: 'number', validation: (Rule) => Rule.required().min(0).max(18) }),
    defineField({ name: 'losses', title: 'Losses', type: 'number', validation: (Rule) => Rule.required().min(0).max(18) }),
    defineField({ name: 'ties', title: 'Ties', type: 'number', initialValue: 0, validation: (Rule) => Rule.min(0).max(2) }),
  defineField({ name: 'streak', title: 'Streak', type: 'string', description: 'e.g., W3, L1', validation: (Rule) => Rule.regex(/^(W|L)\d+$/) }),
    defineField({ name: 'lastUpdated', title: 'Last Updated', type: 'datetime', initialValue: () => new Date().toISOString() }),
  ],
  preview: {
    select: { title: 'teamAbbr', wins: 'wins', losses: 'losses', ties: 'ties', season: 'season' },
    prepare({ title, wins, losses, ties, season }) {
      const rec = `${wins ?? 0}-${losses ?? 0}${(ties ?? 0) ? `-${ties}` : ''}`
      return { title: `${title} (${rec})`, subtitle: `${season}` }
    }
  },
  orderings: [
    {
      title: 'Wins desc',
      name: 'winsDesc',
      by: [ { field: 'wins', direction: 'desc' }, { field: 'losses', direction: 'asc' } ]
    }
  ],
})

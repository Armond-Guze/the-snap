import { defineField, defineType } from 'sanity'

export const standingsType = defineType({
  name: 'standings',
  title: 'NFL Standings',
  type: 'document',
  fields: [
    defineField({
      name: 'teamName',
      title: 'Team Name',
      type: 'string',
      validation: Rule => Rule.required()
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
      name: 'wins',
      title: 'Wins',
      type: 'number',
      validation: Rule => Rule.required().min(0).max(17)
    }),
    defineField({
      name: 'losses',
      title: 'Losses',
      type: 'number',
      validation: Rule => Rule.required().min(0).max(17)
    }),
    defineField({
      name: 'ties',
      title: 'Ties',
      type: 'number',
      initialValue: 0,
      validation: Rule => Rule.min(0).max(17)
    }),
    defineField({
      name: 'winPercentage',
      title: 'Win Percentage',
      type: 'number',
      validation: Rule => Rule.required().min(0).max(1),
      description: 'Win percentage as decimal (e.g., 0.750 for 75%)'
    }),
    defineField({
      name: 'conference',
      title: 'Conference',
      type: 'string',
      options: {
        list: [
          { title: 'AFC', value: 'AFC' },
          { title: 'NFC', value: 'NFC' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'division',
      title: 'Division',
      type: 'string',
      options: {
        list: [
          { title: 'AFC East', value: 'AFC East' },
          { title: 'AFC North', value: 'AFC North' },
          { title: 'AFC South', value: 'AFC South' },
          { title: 'AFC West', value: 'AFC West' },
          { title: 'NFC East', value: 'NFC East' },
          { title: 'NFC North', value: 'NFC North' },
          { title: 'NFC South', value: 'NFC South' },
          { title: 'NFC West', value: 'NFC West' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'season',
      title: 'Season',
      type: 'string',
      initialValue: '2024',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    })
  ],
  preview: {
    select: {
      title: 'teamName',
      subtitle: 'division',
      media: 'teamLogo'
    },
    prepare(selection) {
      const { title, subtitle } = selection
      return {
        title,
        subtitle: `${subtitle} - W/L Record`
      }
    }
  },
  orderings: [
    {
      title: 'Win Percentage (High to Low)',
      name: 'winPercentageDesc',
      by: [
        { field: 'winPercentage', direction: 'desc' },
        { field: 'wins', direction: 'desc' }
      ]
    },
    {
      title: 'Division',
      name: 'division',
      by: [
        { field: 'division', direction: 'asc' },
        { field: 'winPercentage', direction: 'desc' }
      ]
    }
  ]
})

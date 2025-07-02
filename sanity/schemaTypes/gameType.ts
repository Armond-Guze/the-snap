import { defineField, defineType } from 'sanity'

export const gameType = defineType({
  name: 'game',
  title: 'NFL Games',
  type: 'document',
  fields: [
    defineField({
      name: 'week',
      title: 'Week',
      type: 'number',
      validation: Rule => Rule.required().min(1).max(18),
      description: 'NFL Week (1-18 for regular season, 19+ for playoffs)'
    }),
    defineField({
      name: 'homeTeam',
      title: 'Home Team',
      type: 'string',
      validation: Rule => Rule.required(),
      description: 'Full team name (e.g., "Kansas City Chiefs")'
    }),
    defineField({
      name: 'awayTeam',
      title: 'Away Team', 
      type: 'string',
      validation: Rule => Rule.required(),
      description: 'Full team name (e.g., "Buffalo Bills")'
    }),
    defineField({
      name: 'homeTeamLogo',
      title: 'Home Team Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'awayTeamLogo',
      title: 'Away Team Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'gameDate',
      title: 'Game Date & Time',
      type: 'datetime',
      validation: Rule => Rule.required(),
      description: 'When the game is scheduled'
    }),
    defineField({
      name: 'tvNetwork',
      title: 'TV Network',
      type: 'string',
      options: {
        list: [
          { title: 'CBS', value: 'CBS' },
          { title: 'FOX', value: 'FOX' },
          { title: 'NBC', value: 'NBC' },
          { title: 'ESPN', value: 'ESPN' },
          { title: 'Monday Night Football', value: 'MNF' },
          { title: 'Thursday Night Football', value: 'TNF' },
          { title: 'Sunday Night Football', value: 'SNF' },
          { title: 'NFL Network', value: 'NFLN' },
          { title: 'Amazon Prime', value: 'Prime' }
        ]
      }
    }),
    defineField({
      name: 'gameType',
      title: 'Game Type',
      type: 'string',
      options: {
        list: [
          { title: 'Regular Season', value: 'regular' },
          { title: 'Wild Card', value: 'wildcard' },
          { title: 'Divisional', value: 'divisional' },
          { title: 'Conference Championship', value: 'conference' },
          { title: 'Super Bowl', value: 'superbowl' },
          { title: 'Preseason', value: 'preseason' }
        ]
      },
      initialValue: 'regular'
    }),
    defineField({
      name: 'featured',
      title: 'Featured Game',
      type: 'boolean',
      initialValue: false,
      description: 'Show this game prominently on the homepage'
    }),
    defineField({
      name: 'gameImportance',
      title: 'Game Importance',
      type: 'string',
      options: {
        list: [
          { title: 'Game of the Week', value: 'gotw' },
          { title: 'Division Rival', value: 'division' },
          { title: 'Playoff Implications', value: 'playoff' },
          { title: 'Primetime', value: 'primetime' },
          { title: 'Regular Game', value: 'regular' }
        ]
      },
      initialValue: 'regular'
    }),
    defineField({
      name: 'preview',
      title: 'Game Preview',
      type: 'text',
      rows: 3,
      description: 'Brief preview or storyline for this game'
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: true
    }),
    defineField({
      name: 'season',
      title: 'Season',
      type: 'string',
      initialValue: '2024',
      validation: Rule => Rule.required()
    })
  ],
  preview: {
    select: {
      homeTeam: 'homeTeam',
      awayTeam: 'awayTeam',
      gameDate: 'gameDate',
      week: 'week',
      featured: 'featured',
      media: 'homeTeamLogo'
    },
    prepare({ homeTeam, awayTeam, gameDate, week, featured, media }) {
      const date = gameDate ? new Date(gameDate).toLocaleDateString() : 'TBD'
      return {
        title: `${awayTeam} @ ${homeTeam}`,
        subtitle: `Week ${week} - ${date}${featured ? ' ⭐' : ''}`,
        media
      }
    }
  },
  orderings: [
    {
      title: 'Game Date',
      name: 'gameDate',
      by: [
        { field: 'gameDate', direction: 'asc' }
      ]
    },
    {
      title: 'Featured Games First',
      name: 'featured',
      by: [
        { field: 'featured', direction: 'desc' },
        { field: 'gameDate', direction: 'asc' }
      ]
    }
  ]
})

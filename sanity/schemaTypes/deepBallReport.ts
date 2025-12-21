import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons'

export const deepBallReport = defineType({
  name: 'deepBallReport',
  title: 'Deep Ball Report',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(90),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'season',
      title: 'Season',
      type: 'number',
      initialValue: new Date().getFullYear(),
      validation: (Rule) => Rule.required().min(2000).max(2100),
    }),
    defineField({
      name: 'week',
      title: 'Week',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(30),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),

    defineField({
      name: 'indexIntro',
      title: 'Intro (optional)',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.max(260),
    }),

    defineField({
      name: 'leaders',
      title: 'Deep Ball Index (Leaders)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'deepBallLeader',
          fields: [
            defineField({name: 'player', title: 'Player', type: 'reference', to: [{type: 'player'}]}),
            defineField({name: 'playerName', title: 'Manual Name', type: 'string', hidden: ({parent}) => !!parent?.player}),
            defineField({name: 'team', title: 'Team (abbr)', type: 'string', hidden: ({parent}) => !!parent?.player, validation: (Rule) => Rule.max(4)}),
            defineField({
              name: 'grade',
              title: 'Grade',
              type: 'string',
              options: {list: ['A', 'B', 'C', 'D', 'F'].map((g) => ({title: g, value: g})), layout: 'radio'},
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'auraTier',
              title: 'Aura Tier',
              type: 'string',
              options: {
                list: [
                  {title: 'Fog', value: 'fog'},
                  {title: 'Ember', value: 'ember'},
                  {title: 'Plasma', value: 'plasma'},
                  {title: 'Supernova', value: 'supernova'},
                ],
                layout: 'radio',
              },
              initialValue: 'fog',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'auraValue',
              title: 'Aura Value (0–100)',
              type: 'number',
              initialValue: 70,
              validation: (Rule) => Rule.required().min(0).max(100),
            }),
          ],
          preview: {
            select: {name: 'player.name', manualName: 'playerName', grade: 'grade', tier: 'auraTier'},
            prepare(sel) {
              const name = sel.name || sel.manualName || 'Leader'
              const tier = sel.tier ? String(sel.tier).toUpperCase() : '—'
              return {title: name, subtitle: `Grade ${sel.grade || '—'} • ${tier}`}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.max(12).warning('Keep leaders tight—8–12 is ideal.'),
    }),

    defineField({
      name: 'bestPlays',
      title: 'Best 3 Throws / Plays',
      type: 'array',
      of: [defineArrayMember({type: 'snapGraphicCard'})],
      validation: (Rule) => Rule.min(3).max(3).error('Best Plays must be exactly 3 items.'),
    }),

    defineField({
      name: 'worstMiss',
      title: 'Worst Miss',
      type: 'snapGraphicCard',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'body',
      title: 'Body (optional)',
      type: 'blockContent',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      week: 'week',
      season: 'season',
    },
    prepare(sel) {
      const wk = sel.week ? `Week ${sel.week}` : 'Week —'
      const yr = sel.season ? String(sel.season) : ''
      return {title: sel.title || 'Deep Ball Report', subtitle: `${yr} • ${wk}`}
    },
  },
})

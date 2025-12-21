import {defineField, defineType} from 'sanity'

const GRADE_OPTIONS = ['A', 'B', 'C', 'D', 'F'] as const
const AURA_TIER_OPTIONS = ['fog', 'ember', 'plasma', 'supernova'] as const

export const snapGraphicCard = defineType({
  name: 'snapGraphicCard',
  title: 'Snap Graphic Card',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Short headline for the play/segment (shown on the card).',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Optional one-liner (e.g. “Week 15 • 44-yard TD”).',
      validation: (Rule) => Rule.max(90),
    }),

    defineField({
      name: 'subject',
      title: 'Subject',
      type: 'object',
      fields: [
        defineField({
          name: 'primaryPlayer',
          title: 'Primary Player (reference)',
          type: 'reference',
          to: [{type: 'player'}],
          description: 'Optional—use if you want canonical player data.',
        }),
        defineField({
          name: 'playerName',
          title: 'Manual Player Name',
          type: 'string',
          hidden: ({parent}) => !!parent?.primaryPlayer,
        }),
        defineField({
          name: 'team',
          title: 'Team (abbr)',
          type: 'string',
          description: 'Optional 2–3 letter code (e.g. KC, DAL).',
          hidden: ({parent}) => !!parent?.primaryPlayer,
          validation: (Rule) => Rule.max(4),
        }),
        defineField({
          name: 'position',
          title: 'Position',
          type: 'string',
          description: 'Optional (QB/WR/CB/etc).',
          hidden: ({parent}) => !!parent?.primaryPlayer,
          validation: (Rule) => Rule.max(6),
        }),
      ],
    }),

    defineField({
      name: 'grade',
      title: 'Grade (A–F)',
      type: 'string',
      options: {
        list: GRADE_OPTIONS.map((g) => ({title: g, value: g})),
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'aura',
      title: 'Aura Meter',
      type: 'object',
      fields: [
        defineField({
          name: 'tier',
          title: 'Tier',
          type: 'string',
          options: {
            list: AURA_TIER_OPTIONS.map((t) => ({
              title: t.charAt(0).toUpperCase() + t.slice(1),
              value: t,
            })),
            layout: 'radio',
          },
          initialValue: 'fog',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'value',
          title: 'Meter Value (0–100)',
          type: 'number',
          description: 'Controls where the needle lands.',
          initialValue: 70,
          validation: (Rule) => Rule.required().min(0).max(100),
        }),
        defineField({
          name: 'labelOverride',
          title: 'Label Override (optional)',
          type: 'string',
          description: 'Leave blank to use the tier name (Fog/Ember/Plasma/Supernova).',
          validation: (Rule) => Rule.max(18),
        }),
      ],
    }),

    defineField({
      name: 'trajectory',
      title: 'Trajectory Sticker',
      type: 'object',
      fields: [
        defineField({
          name: 'type',
          title: 'Type',
          type: 'string',
          options: {
            list: [
              {title: 'Moonball', value: 'moonball'},
              {title: 'Rope', value: 'rope'},
              {title: 'Layer', value: 'layer'},
              {title: 'Back-shoulder', value: 'back-shoulder'},
              {title: 'Slot fade', value: 'slot-fade'},
              {title: 'Elevator shot', value: 'elevator-shot'},
              {title: 'Knife edge', value: 'knife-edge'},
              {title: 'UFO drop', value: 'ufo-drop'},
              {title: 'Ghost window', value: 'ghost-window'},
              {title: 'Stun gun', value: 'stun-gun'},
              {title: 'Paint roller', value: 'paint-roller'},
              {title: 'Bank shot', value: 'bank-shot'},
              {title: 'Wrong-foot rocket', value: 'wrong-foot-rocket'},
            ],
          },
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'variant',
          title: 'Variant (optional)',
          type: 'string',
          description: 'Optional add-on (e.g. “Knife Edge”, “UFO Drop”, “Late Hands”).',
          validation: (Rule) => Rule.max(22),
        }),
      ],
    }),

    defineField({
      name: 'pressure',
      title: 'Pressure Stamp',
      type: 'string',
      options: {
        list: [
          {title: 'Clean', value: 'clean'},
          {title: 'Muddy', value: 'muddy'},
          {title: 'Chaos', value: 'chaos'},
        ],
        layout: 'radio',
      },
      initialValue: 'clean',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'dawgIndex',
      title: 'Dawg Index (0–10)',
      type: 'object',
      description: 'Measures aggression + fearless throws. Renders as a 10-segment bar.',
      fields: [
        defineField({
          name: 'value',
          title: 'Value',
          type: 'number',
          initialValue: 7,
          validation: (Rule) => Rule.min(0).max(10),
        }),
        defineField({
          name: 'lowLabel',
          title: 'Low Label',
          type: 'string',
          initialValue: 'House Cat',
          validation: (Rule) => Rule.max(18),
        }),
        defineField({
          name: 'highLabel',
          title: 'High Label',
          type: 'string',
          initialValue: 'Junkyard Dawg',
          validation: (Rule) => Rule.max(18),
        }),
      ],
    }),

    defineField({
      name: 'callout',
      title: 'Callout (1 line)',
      type: 'string',
      description: 'Ultra-short “why it worked” line. Keep it punchy.',
      validation: (Rule) => Rule.max(110),
    }),

    defineField({
      name: 'media',
      title: 'Media (optional)',
      type: 'object',
      fields: [
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: {hotspot: true},
          fields: [defineField({name: 'alt', title: 'Alt text', type: 'string'})],
        }),
        defineField({
          name: 'videoUrl',
          title: 'Video URL',
          type: 'url',
        }),
      ],
    }),

    defineField({
      name: 'serial',
      title: 'Serial (optional)',
      type: 'string',
      description: 'Example: DBI-2025-WK15-03. Leave blank to auto-hide.',
      validation: (Rule) => Rule.max(24),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      grade: 'grade',
      tier: 'aura.tier',
      media: 'media.image',
    },
    prepare(sel) {
      const grade = sel.grade ? `Grade ${sel.grade}` : 'No grade'
      const tier = sel.tier ? String(sel.tier).toUpperCase() : '—'
      return {
        title: sel.title || 'Snap Graphic Card',
        subtitle: `${grade} • ${tier}`,
        media: sel.media,
      }
    },
  },
})

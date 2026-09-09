import {defineArrayMember, defineField, defineType} from 'sanity'

type EditorialBriefValue = {
  targetQuery?: string
  searchIntent?: string
  readerPromise?: string
  originalValue?: string
  sources?: unknown[]
  internalLinkPlan?: unknown[]
  overlapChecked?: boolean
  humanReviewed?: boolean
  factChecked?: boolean
  imageRightsConfirmed?: boolean
}

const requiresEditorialGate = (document?: Record<string, unknown>) =>
  document?.published === true && document?.format !== 'powerRankings'

export const editorialBriefType = defineType({
  name: 'editorialBrief',
  title: 'Editorial Brief',
  type: 'object',
  description:
    'The search intent, original contribution, evidence, and link plan the writer must satisfy before publication.',
  validation: (Rule) =>
    Rule.custom((value: EditorialBriefValue | undefined, context) => {
      if (!requiresEditorialGate(context.document)) return true

      const missing: string[] = []
      if (!value?.targetQuery?.trim()) missing.push('target query')
      if (!value?.searchIntent) missing.push('search intent')
      if (!value?.readerPromise?.trim()) missing.push('reader promise')
      if (!value?.originalValue?.trim() || value.originalValue.trim().length < 60) {
        missing.push('specific original value (at least 60 characters)')
      }
      if (!Array.isArray(value?.sources) || value.sources.length === 0) {
        missing.push('at least one primary or authoritative source')
      }
      if (!Array.isArray(value?.internalLinkPlan) || value.internalLinkPlan.length < 2) {
        missing.push('at least two planned internal links')
      }
      if (value?.overlapChecked !== true) missing.push('existing-content overlap check')
      if (value?.humanReviewed !== true) missing.push('human review confirmation')
      if (value?.factChecked !== true) missing.push('fact-check confirmation')
      if (value?.imageRightsConfirmed !== true) missing.push('image-rights confirmation')

      return missing.length
        ? `Complete the editorial quality gate before publishing: ${missing.join(', ')}.`
        : true
    }).error(),
  fields: [
    defineField({
      name: 'targetQuery',
      title: 'Primary Search Query',
      type: 'string',
      description: 'One specific query or reader question. Do not target several unrelated intents.',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'searchIntent',
      title: 'Search Intent',
      type: 'string',
      options: {
        list: [
          {title: 'Breaking news / current update', value: 'news'},
          {title: 'Evergreen explainer', value: 'explainer'},
          {title: 'Original analysis', value: 'analysis'},
          {title: 'Data / rankings resource', value: 'data'},
          {title: 'Fantasy strategy', value: 'fantasy'},
          {title: 'Reported story', value: 'reported'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'readerPromise',
      title: 'Reader Promise',
      type: 'text',
      rows: 2,
      description: 'What will the reader understand or be able to do after reading this page?',
      validation: (Rule) => Rule.max(220),
    }),
    defineField({
      name: 'originalValue',
      title: 'What The Snap Adds',
      type: 'text',
      rows: 4,
      description:
        'Name the analysis, calculation, dataset, comparison, reporting, example, or conclusion that is not present in a basic rewrite.',
      validation: (Rule) => Rule.max(600),
    }),
    defineField({
      name: 'sources',
      title: 'Evidence / Source Plan',
      type: 'array',
      description: 'Prefer league, team, contract, statistical, or other primary sources over secondary rewrites.',
      of: [
        defineArrayMember({
          name: 'editorialSource',
          title: 'Source',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Source Name',
              type: 'string',
              validation: (Rule) => Rule.required().max(120),
            }),
            defineField({
              name: 'url',
              title: 'Source URL',
              type: 'url',
              validation: (Rule) =>
                Rule.required().uri({scheme: ['http', 'https'], allowRelative: false}),
            }),
            defineField({
              name: 'sourceType',
              title: 'Source Type',
              type: 'string',
              options: {
                list: [
                  {title: 'Primary / official', value: 'primary'},
                  {title: 'Original data', value: 'data'},
                  {title: 'Direct reporting / interview', value: 'reporting'},
                  {title: 'Authoritative secondary source', value: 'secondary'},
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'note',
              title: 'Claim(s) Supported',
              type: 'string',
              validation: (Rule) => Rule.max(200),
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'sourceType'},
          },
        }),
      ],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'internalLinkPlan',
      title: 'Internal Link Plan',
      type: 'array',
      description:
        'Choose closely related articles or hubs. These references are the plan; links must also be placed contextually in the Body.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'article'}, {type: 'topicHub'}],
          options: {disableNew: true},
        }),
      ],
      validation: (Rule) => Rule.unique().max(6),
    }),
    defineField({
      name: 'overlapChecked',
      title: 'Existing inventory was checked for overlap',
      type: 'boolean',
      description: 'Confirm that this should be a new URL rather than an upgrade, merge, or redirect.',
      initialValue: false,
    }),
    defineField({
      name: 'humanReviewed',
      title: 'Human editor reviewed the full draft',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'factChecked',
      title: 'Names, dates, stats, quotes, and links were checked',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'imageRightsConfirmed',
      title: 'Image rights, credit, and alt text were checked',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
